package com.stridemate.api.activity.service;

import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.dto.ActivityResponse;
import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.exception.InvalidActivityException;
import com.stridemate.api.scoring.ScoringService;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;

    @Autowired
    public ActivityService(ActivityRepository activityRepository, UserRepository userRepository, ScoringService scoringService) {
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.scoringService = scoringService;
    }

    public ActivityResponse createActivity(ActivityRequest request, String email) {
        validateActivityRequest(request);

        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

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
        return toResponse(savedActivity);
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

        // Impossibility speed check: prevent GPS teleportation / crazy numbers (> 70 km/h for running/walking, > 100 km/h for cycling)
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

    private ActivityResponse toResponse(Activity activity) {
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
