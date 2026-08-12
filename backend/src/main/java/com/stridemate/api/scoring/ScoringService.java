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
            case SWIMMING -> calculateDurationPoints(activity.getDurationMinutes(), 15);
            case GYM -> calculateDurationPoints(activity.getDurationMinutes(), 5);
            case DAILY_STEPS -> calculateStepsPoints(activity.getSteps(), 1, 100);
        };
    }

    private int calculateDistancePoints(BigDecimal distanceKm, int ratePerKm) {
        if (distanceKm == null || distanceKm.compareTo(BigDecimal.ZERO) <= 0) {
            return 0;
        }
        // Multiply distance by rate and floor the result
        return distanceKm.multiply(BigDecimal.valueOf(ratePerKm))
                .setScale(0, RoundingMode.FLOOR)
                .intValue();
    }

    private int calculateDurationPoints(Integer durationMinutes, int ratePerMinute) {
        if (durationMinutes == null || durationMinutes <= 0) {
            return 0;
        }
        // Only complete minutes count
        return durationMinutes * ratePerMinute;
    }

    private int calculateStepsPoints(Integer steps, int rate, int block) {
        if (steps == null || steps <= 0) {
            return 0;
        }
        // Only complete blocks count
        return (steps / block) * rate;
    }
}
