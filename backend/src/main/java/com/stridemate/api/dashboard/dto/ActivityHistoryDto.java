package com.stridemate.api.dashboard.dto;

import com.stridemate.api.activity.entity.SportType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ActivityHistoryDto {
    private UUID activityId;
    private SportType sport;
    private BigDecimal distanceKm;
    private Integer durationMinutes;
    private Integer durationSeconds;
    private Integer steps;
    private Integer totalDurationSeconds;
    private Integer calories;
    private Integer points;
    private Instant recordedAt;

    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }

    public SportType getSport() { return sport; }
    public void setSport(SportType sport) { this.sport = sport; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Integer getSteps() { return steps; }
    public void setSteps(Integer steps) { this.steps = steps; }

    public Integer getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(Integer totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
