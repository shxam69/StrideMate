package com.stridemate.api.scoring;

import com.stridemate.api.activity.entity.Activity;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ScoringService {

    public int calculatePoints(Activity activity) {
        if (activity == null || activity.getSport() == null) {
            return 0;
        }

        return switch (activity.getSport()) {
            case RUNNING -> calculateDistancePoints(activity.getDistanceKm(), 100);
            case WALKING -> calculateDistancePoints(activity.getDistanceKm(), 50);
            case CYCLING -> calculateDistancePoints(activity.getDistanceKm(), 25);
            case SWIMMING -> calculateDurationPoints(activity.getDurationMinutes(), activity.getDurationSeconds(), 15);
            case GYM -> calculateDurationPoints(activity.getDurationMinutes(), activity.getDurationSeconds(), 5);
            case DAILY_STEPS -> calculateStepsPoints(activity.getSteps(), 1, 100);
        };
    }

    private int calculateDistancePoints(BigDecimal distanceKm, int ratePerKm) {
        if (distanceKm == null || distanceKm.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        // Formula: floor(distance × conversionRate)
        return distanceKm.multiply(BigDecimal.valueOf(ratePerKm))
                .setScale(0, RoundingMode.FLOOR)
                .intValue();
    }

    private int calculateDurationPoints(Integer durationMinutes, Integer durationSeconds, int ratePerMinute) {
        int m = durationMinutes == null ? 0 : durationMinutes;
        int s = durationSeconds == null ? 0 : durationSeconds;
        int totalSeconds = (m * 60) + s;
        
        if (totalSeconds <= 0) {
            return 0;
        }
        // Formula: floor(totalSeconds / 60) × rate
        int completedMinutes = totalSeconds / 60; // integer division inherently floors
        return completedMinutes * ratePerMinute;
    }

    private int calculateStepsPoints(Integer steps, int rate, int block) {
        if (steps == null || steps <= 0) {
            return 0;
        }
        // Formula: floor(steps / 100) × rate
        int completedBlocks = steps / block; // integer division inherently floors
        return completedBlocks * rate;
    }
}
