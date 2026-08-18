package com.stridemate.api.activity.service;

import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.dto.ActivityResponse;
import com.stridemate.api.activity.dto.ActivityRouteResponseDto;
import com.stridemate.api.activity.dto.RoutePointDto;
import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.ActivityRoutePoint;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.ActivityRoutePointRepository;
import com.stridemate.api.exception.InvalidActivityException;
import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.gamification.dto.ActivitySaveResultDto;
import com.stridemate.api.gamification.service.GamificationService;
import com.stridemate.api.scoring.ScoringService;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityRoutePointRepository routePointRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;
    private final GamificationService gamificationService;

    @Autowired
    public ActivityService(
            ActivityRepository activityRepository,
            ActivityRoutePointRepository routePointRepository,
            UserRepository userRepository,
            ScoringService scoringService,
            GamificationService gamificationService) {
        this.activityRepository = activityRepository;
        this.routePointRepository = routePointRepository;
        this.userRepository = userRepository;
        this.scoringService = scoringService;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public ActivitySaveResultDto createActivity(ActivityRequest request, String email) {
        validateActivityRequest(request);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Activity activity = new Activity();
        activity.setUser(user);
        
        SportType resolvedSport = resolveSportType(request);
        activity.setSport(resolvedSport);
        
        activity.setDistanceKm(request.getDistanceKm());
        activity.setDurationMinutes(request.getDurationMinutes());
        activity.setDurationSeconds(request.getDurationSeconds());
        activity.setSteps(request.getSteps());
        
        // Auto-track telemetry & breakdown
        activity.setTotalDurationSeconds(request.getTotalDurationSeconds());
        activity.setWalkingDurationSeconds(request.getWalkingDurationSeconds());
        activity.setJoggingDurationSeconds(request.getJoggingDurationSeconds());
        activity.setRunningDurationSeconds(request.getRunningDurationSeconds());
        activity.setCyclingDurationSeconds(request.getCyclingDurationSeconds());
        activity.setStartedAt(request.getStartedAt());
        activity.setEndedAt(request.getEndedAt() != null ? request.getEndedAt() : Instant.now());
        
        // If durationMinutes/Seconds are null but totalDurationSeconds is present, populate durationMinutes/Seconds
        if (activity.getTotalDurationSeconds() != null && activity.getTotalDurationSeconds() > 0) {
            if (activity.getDurationMinutes() == null && activity.getDurationSeconds() == null) {
                activity.setDurationMinutes(activity.getTotalDurationSeconds() / 60);
                activity.setDurationSeconds(activity.getTotalDurationSeconds() % 60);
            }
        }

        activity.setRecordedAt(Instant.now()); // Set server-side

        // Authoritative server-side calculations
        int points = scoringService.calculatePoints(activity);
        int calories = scoringService.calculateCalories(activity);
        
        activity.setPoints(points);
        activity.setCalories(calories);

        Activity savedActivity = activityRepository.save(activity);

        // Persist GPS Route Points if provided
        if (request.getRoutePoints() != null && !request.getRoutePoints().isEmpty()) {
            List<ActivityRoutePoint> pointsToSave = new ArrayList<>();
            // Reasonable downsampling if > 1500 points to prevent bloat
            List<RoutePointDto> rawPoints = request.getRoutePoints();
            int step = Math.max(1, rawPoints.size() / 1000);
            
            for (int i = 0; i < rawPoints.size(); i += step) {
                RoutePointDto p = rawPoints.get(i);
                if (p.getLatitude() != null && p.getLongitude() != null) {
                    pointsToSave.add(new ActivityRoutePoint(
                            savedActivity,
                            p.getLatitude(),
                            p.getLongitude(),
                            p.getAccuracy(),
                            p.getSpeed(),
                            p.getRecordedAt() != null ? p.getRecordedAt() : Instant.now()
                    ));
                }
            }
            // Always ensure the very last point is captured
            if (rawPoints.size() > 1 && (rawPoints.size() - 1) % step != 0) {
                RoutePointDto last = rawPoints.get(rawPoints.size() - 1);
                if (last.getLatitude() != null && last.getLongitude() != null) {
                    pointsToSave.add(new ActivityRoutePoint(
                            savedActivity,
                            last.getLatitude(),
                            last.getLongitude(),
                            last.getAccuracy(),
                            last.getSpeed(),
                            last.getRecordedAt() != null ? last.getRecordedAt() : Instant.now()
                    ));
                }
            }
            routePointRepository.saveAll(pointsToSave);
        }

        // Atomic Gamification Processing
        GamificationService.ProgressionResult prog = gamificationService.processActivityGamification(user, savedActivity);

        ActivitySaveResultDto result = new ActivitySaveResultDto();
        result.setActivity(toResponse(savedActivity));
        result.setPointsEarned(prog.pointsEarned);
        result.setXpEarned(prog.xpEarned);
        result.setCurrentXp(prog.currentXp);
        result.setNextLevelXp(prog.nextLevelXp);
        result.setTotalXp(prog.totalXp);
        result.setLevel(prog.level);
        result.setPreviousLevel(prog.previousLevel);
        result.setLevelUp(prog.levelUp);
        result.setCurrentStreak(prog.currentStreak);
        result.setLongestStreak(prog.longestStreak);
        result.setStreakMaintained(prog.isStreakMaintained);
        result.setCompletedQuests(prog.completedQuests);
        result.setUnlockedAchievements(prog.unlockedAchievements);

        return result;
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getUserActivities(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Activity> activities = activityRepository.findByUserIdOrderByRecordedAtDesc(user.getId());
        return activities.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(UUID activityId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + activityId));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view this activity.");
        }

        return toResponse(activity);
    }

    @Transactional(readOnly = true)
    public ActivityRouteResponseDto getActivityRoute(UUID activityId, String email, boolean privacyTrim) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + activityId));

        if (!activity.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view this route.");
        }

        List<ActivityRoutePoint> rawPoints = routePointRepository.findByActivityIdOrderByRecordedAtAsc(activityId);
        List<RoutePointDto> mappedPoints = rawPoints.stream()
                .map(p -> new RoutePointDto(p.getLatitude(), p.getLongitude(), p.getAccuracy(), p.getSpeed(), p.getRecordedAt()))
                .collect(Collectors.toList());

        // Privacy Trimming: If requested and route has >= 10 points, trim first 10% and last 10% (up to 3 points)
        if (privacyTrim && mappedPoints.size() >= 8) {
            int trimCount = Math.min(3, Math.max(1, mappedPoints.size() / 10));
            int fromIndex = trimCount;
            int toIndex = mappedPoints.size() - trimCount;
            if (fromIndex < toIndex) {
                mappedPoints = new ArrayList<>(mappedPoints.subList(fromIndex, toIndex));
            }
        }

        return new ActivityRouteResponseDto(
                activity.getId(),
                activity.getSport() != null ? activity.getSport().name() : "WALKING",
                activity.getDistanceKm(),
                activity.getTotalDurationSeconds() != null ? activity.getTotalDurationSeconds() : 0,
                activity.getCalories(),
                activity.getPoints(),
                privacyTrim,
                mappedPoints
        );
    }

    private SportType resolveSportType(ActivityRequest request) {
        if (request.getSport() != null) {
            return request.getSport();
        }

        // Infer dominant sport from segmented breakdown
        int walkSec = request.getWalkingDurationSeconds() != null ? request.getWalkingDurationSeconds() : 0;
        int jogSec = request.getJoggingDurationSeconds() != null ? request.getJoggingDurationSeconds() : 0;
        int runSec = request.getRunningDurationSeconds() != null ? request.getRunningDurationSeconds() : 0;
        int cycleSec = request.getCyclingDurationSeconds() != null ? request.getCyclingDurationSeconds() : 0;

        if (cycleSec > walkSec && cycleSec > (jogSec + runSec)) {
            return SportType.CYCLING;
        } else if (walkSec >= (jogSec + runSec) && walkSec > 0) {
            return SportType.WALKING;
        } else if ((jogSec + runSec) > 0) {
            return SportType.RUNNING;
        }

        return SportType.WALKING;
    }

    private void validateActivityRequest(ActivityRequest request) {
        boolean isSegmentedOrLive = isSegmentedActivity(request);

        if (isSegmentedOrLive) {
            validateSegmentedActivity(request);
            return;
        }

        // Legacy manual activity validation
        if (request.getSport() == null) {
            throw new InvalidActivityException("Sport type is required");
        }

        switch (request.getSport()) {
            case RUNNING:
            case WALKING:
            case CYCLING:
                if (request.getDistanceKm() == null || request.getDistanceKm().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new InvalidActivityException("Distance is required and must be greater than zero for " + request.getSport());
                }
                if (request.getDurationMinutes() != null || request.getDurationSeconds() != null || request.getSteps() != null) {
                    throw new InvalidActivityException("Duration and steps are not applicable for " + request.getSport());
                }
                break;
            case SWIMMING:
            case GYM:
                if (request.getDurationMinutes() == null && request.getTotalDurationSeconds() == null) {
                    throw new InvalidActivityException("Duration minutes is required for " + request.getSport());
                }
                if (request.getDurationSeconds() != null && (request.getDurationSeconds() < 0 || request.getDurationSeconds() >= 60)) {
                    throw new InvalidActivityException("Duration seconds must be between 0 and 59");
                }
                if (request.getDistanceKm() != null || request.getSteps() != null) {
                    throw new InvalidActivityException("Distance and steps are not applicable for " + request.getSport());
                }
                break;
            case DAILY_STEPS:
                if (request.getSteps() == null || request.getSteps() <= 0) {
                    throw new InvalidActivityException("Steps are required and must be greater than zero for " + request.getSport());
                }
                if (request.getDistanceKm() != null || request.getDurationMinutes() != null || request.getDurationSeconds() != null) {
                    throw new InvalidActivityException("Distance and duration are not applicable for " + request.getSport());
                }
                break;
        }
    }

    private boolean isSegmentedActivity(ActivityRequest request) {
        if (request.getSport() == SportType.GYM || request.getSport() == SportType.SWIMMING || request.getSport() == SportType.DAILY_STEPS) {
            return false;
        }
        return (request.getWalkingDurationSeconds() != null && request.getWalkingDurationSeconds() > 0) ||
               (request.getJoggingDurationSeconds() != null && request.getJoggingDurationSeconds() > 0) ||
               (request.getRunningDurationSeconds() != null && request.getRunningDurationSeconds() > 0) ||
               (request.getCyclingDurationSeconds() != null && request.getCyclingDurationSeconds() > 0) ||
               (request.getTotalDurationSeconds() != null && request.getTotalDurationSeconds() > 0);
    }

    private void validateSegmentedActivity(ActivityRequest request) {
        if (request.getDistanceKm() != null && request.getDistanceKm().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidActivityException("Distance cannot be negative");
        }

        int walkSec = request.getWalkingDurationSeconds() != null ? request.getWalkingDurationSeconds() : 0;
        int jogSec = request.getJoggingDurationSeconds() != null ? request.getJoggingDurationSeconds() : 0;
        int runSec = request.getRunningDurationSeconds() != null ? request.getRunningDurationSeconds() : 0;
        int cycleSec = request.getCyclingDurationSeconds() != null ? request.getCyclingDurationSeconds() : 0;
        int totalSec = request.getTotalDurationSeconds() != null ? request.getTotalDurationSeconds() : 0;

        if (totalSec <= 0 && (walkSec + jogSec + runSec + cycleSec) <= 0) {
            throw new InvalidActivityException("Total duration must be greater than zero for a live tracking session");
        }

        // Sum of segment durations cannot exceed total duration (with a small 60s tolerance for clock drift)
        int sumSegments = walkSec + jogSec + runSec + cycleSec;
        if (totalSec > 0 && sumSegments > totalSec + 60) {
            throw new InvalidActivityException("Sum of segment durations (" + sumSegments + "s) exceeds total duration (" + totalSec + "s)");
        }

        // Impossibility speed check: prevent GPS teleportation / crazy numbers (> 65 km/h for running/walking, > 100 km/h for cycling)
        if (request.getDistanceKm() != null && request.getDistanceKm().compareTo(BigDecimal.ZERO) > 0) {
            int effectiveSec = totalSec > 0 ? totalSec : sumSegments;
            if (effectiveSec > 0) {
                double speedKmh = (request.getDistanceKm().doubleValue() / (effectiveSec / 3600.0));
                double maxAllowedSpeed = (cycleSec > (walkSec + jogSec + runSec) || request.getSport() == SportType.CYCLING) ? 100.0 : 65.0;
                if (speedKmh > maxAllowedSpeed) {
                    throw new InvalidActivityException("Impossible speed/distance telemetry detected: " + String.format("%.1f", speedKmh) + " km/h");
                }
            }
        }
    }

    public ActivityResponse toResponse(Activity activity) {
        ActivityResponse response = new ActivityResponse();
        response.setActivityId(activity.getId());
        response.setUserId(activity.getUser().getId());
        response.setSport(activity.getSport());
        response.setDistanceKm(activity.getDistanceKm());
        response.setDurationMinutes(activity.getDurationMinutes());
        response.setDurationSeconds(activity.getDurationSeconds());
        response.setSteps(activity.getSteps());
        response.setTotalDurationSeconds(activity.getTotalDurationSeconds());
        response.setWalkingDurationSeconds(activity.getWalkingDurationSeconds());
        response.setJoggingDurationSeconds(activity.getJoggingDurationSeconds());
        response.setRunningDurationSeconds(activity.getRunningDurationSeconds());
        response.setCyclingDurationSeconds(activity.getCyclingDurationSeconds());
        response.setCalories(activity.getCalories());
        response.setStartedAt(activity.getStartedAt());
        response.setEndedAt(activity.getEndedAt());
        response.setPoints(activity.getPoints());
        response.setRecordedAt(activity.getRecordedAt());
        return response;
    }
}
