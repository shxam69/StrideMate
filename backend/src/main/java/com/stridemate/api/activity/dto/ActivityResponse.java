package com.stridemate.api.activity.dto;

import com.stridemate.api.activity.entity.SportType;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class ActivityResponse {

    private UUID activityId;
    private UUID userId;
    private SportType sport;
    private BigDecimal distanceKm;
    private Integer durationMinutes;
    private Integer durationSeconds;
    private Integer steps;
    private Integer points;
    private Instant recordedAt;

    // Getters and Setters
    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

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

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
