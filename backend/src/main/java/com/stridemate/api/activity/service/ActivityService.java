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
        activity.setSport(request.getSport());
        activity.setDistanceKm(request.getDistanceKm());
        activity.setDurationMinutes(request.getDurationMinutes());
        activity.setDurationSeconds(request.getDurationSeconds());
        activity.setSteps(request.getSteps());
        activity.setRecordedAt(Instant.now()); // Set server-side

        int points = scoringService.calculatePoints(activity);
        activity.setPoints(points);

        Activity savedActivity = activityRepository.save(activity);
        return toResponse(savedActivity);
    }

    private void validateActivityRequest(ActivityRequest request) {
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
                if (request.getDurationMinutes() == null) {
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

    private ActivityResponse toResponse(Activity activity) {
        ActivityResponse response = new ActivityResponse();
        response.setActivityId(activity.getId());
        response.setUserId(activity.getUser().getId());
        response.setSport(activity.getSport());
        response.setDistanceKm(activity.getDistanceKm());
        response.setDurationMinutes(activity.getDurationMinutes());
        response.setDurationSeconds(activity.getDurationSeconds());
        response.setSteps(activity.getSteps());
        response.setPoints(activity.getPoints());
        response.setRecordedAt(activity.getRecordedAt());
        return response;
    }
}
