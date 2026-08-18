package com.stridemate.api.scoring;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ScoringService {

    public int calculatePoints(Activity activity) {
        if (activity == null) {
            return 0;
        }

        // Check if this is an auto-tracked / segmented session
        if (hasSegmentBreakdown(activity)) {
            return calculateSegmentedPoints(activity);
        }

        if (activity.getSport() == null) {
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

    public int calculateCalories(Activity activity) {
        if (activity == null) {
            return 0;
        }

        double totalKcal = 0.0;

        int walkSec = activity.getWalkingDurationSeconds() != null ? activity.getWalkingDurationSeconds() : 0;
        int jogSec = activity.getJoggingDurationSeconds() != null ? activity.getJoggingDurationSeconds() : 0;
        int runSec = activity.getRunningDurationSeconds() != null ? activity.getRunningDurationSeconds() : 0;
        int cycleSec = activity.getCyclingDurationSeconds() != null ? activity.getCyclingDurationSeconds() : 0;

        if (walkSec > 0 || jogSec > 0 || runSec > 0 || cycleSec > 0) {
            totalKcal += (walkSec / 60.0) * 4.5;
            totalKcal += (jogSec / 60.0) * 8.5;
            totalKcal += (runSec / 60.0) * 12.0;
            totalKcal += (cycleSec / 60.0) * 8.0;
            return (int) Math.round(totalKcal);
        }

        // Duration fallback
        int durMin = activity.getDurationMinutes() != null ? activity.getDurationMinutes() : 0;
        int durSec = activity.getDurationSeconds() != null ? activity.getDurationSeconds() : 0;
        int totalSeconds = (durMin * 60) + durSec;
        if (activity.getTotalDurationSeconds() != null && activity.getTotalDurationSeconds() > 0) {
            totalSeconds = activity.getTotalDurationSeconds();
        }

        if (activity.getSport() == SportType.GYM && totalSeconds > 0) {
            return (int) Math.round((totalSeconds / 60.0) * 6.0);
        }
        if (activity.getSport() == SportType.SWIMMING && totalSeconds > 0) {
            return (int) Math.round((totalSeconds / 60.0) * 10.0);
        }

        // Distance fallback
        if (activity.getDistanceKm() != null && activity.getDistanceKm().compareTo(BigDecimal.ZERO) > 0) {
            double dist = activity.getDistanceKm().doubleValue();
            if (activity.getSport() == SportType.RUNNING) {
                return (int) Math.round(dist * 65.0);
            } else if (activity.getSport() == SportType.WALKING) {
                return (int) Math.round(dist * 45.0);
            } else if (activity.getSport() == SportType.CYCLING) {
                return (int) Math.round(dist * 30.0);
            }
        }

        if (activity.getSteps() != null && activity.getSteps() > 0) {
            return (int) Math.round(activity.getSteps() * 0.04);
        }

        return 0;
    }

    private boolean hasSegmentBreakdown(Activity activity) {
        return (activity.getWalkingDurationSeconds() != null && activity.getWalkingDurationSeconds() > 0) ||
               (activity.getJoggingDurationSeconds() != null && activity.getJoggingDurationSeconds() > 0) ||
               (activity.getRunningDurationSeconds() != null && activity.getRunningDurationSeconds() > 0) ||
               (activity.getCyclingDurationSeconds() != null && activity.getCyclingDurationSeconds() > 0);
    }

    private int calculateSegmentedPoints(Activity activity) {
        int walkSec = activity.getWalkingDurationSeconds() != null ? activity.getWalkingDurationSeconds() : 0;
        int jogSec = activity.getJoggingDurationSeconds() != null ? activity.getJoggingDurationSeconds() : 0;
        int runSec = activity.getRunningDurationSeconds() != null ? activity.getRunningDurationSeconds() : 0;
        int cycleSec = activity.getCyclingDurationSeconds() != null ? activity.getCyclingDurationSeconds() : 0;

        BigDecimal totalDist = activity.getDistanceKm();
        if (totalDist != null && totalDist.compareTo(BigDecimal.ZERO) > 0) {
            double totalDistVal = totalDist.doubleValue();

            // Weighted speed factors: Walking ~4.5 km/h, Jogging ~8 km/h, Running ~12 km/h, Cycling ~20 km/h
            double wWalk = walkSec * 4.5;
            double wJog = jogSec * 8.0;
            double wRun = runSec * 12.0;
            double wCycle = cycleSec * 20.0;
            double wTotal = wWalk + wJog + wRun + wCycle;

            if (wTotal > 0) {
                double dWalk = totalDistVal * (wWalk / wTotal);
                double dJog = totalDistVal * (wJog / wTotal);
                double dRun = totalDistVal * (wRun / wTotal);
                double dCycle = totalDistVal * (wCycle / wTotal);

                int ptsWalk = (int) Math.floor(dWalk * 50.0);
                int ptsJog = (int) Math.floor(dJog * 100.0);
                int ptsRun = (int) Math.floor(dRun * 100.0);
                int ptsCycle = (int) Math.floor(dCycle * 25.0);

                int totalPts = ptsWalk + ptsJog + ptsRun + ptsCycle;
                return Math.max(1, totalPts);
            }
        }

        // Duration-based fallback if distance was negligible (e.g. treadmill / indoor movement)
        int pts = 0;
        pts += (walkSec / 60) * 2;
        pts += (jogSec / 60) * 5;
        pts += (runSec / 60) * 8;
        pts += (cycleSec / 60) * 4;
        return pts;
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
