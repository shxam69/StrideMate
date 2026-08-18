package com.stridemate.api.activity.dto;

import com.stridemate.api.activity.entity.SportType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class ActivityRequest {

    private SportType sport;

    @PositiveOrZero(message = "Distance cannot be negative")
    private BigDecimal distanceKm;

    @PositiveOrZero(message = "Duration minutes cannot be negative")
    private Integer durationMinutes;

    @PositiveOrZero(message = "Duration seconds cannot be negative")
    private Integer durationSeconds;

    @PositiveOrZero(message = "Steps cannot be negative")
    private Integer steps;

    @PositiveOrZero(message = "Total duration seconds cannot be negative")
    private Integer totalDurationSeconds;

    @PositiveOrZero(message = "Walking duration seconds cannot be negative")
    private Integer walkingDurationSeconds;

    @PositiveOrZero(message = "Jogging duration seconds cannot be negative")
    private Integer joggingDurationSeconds;

    @PositiveOrZero(message = "Running duration seconds cannot be negative")
    private Integer runningDurationSeconds;

    @PositiveOrZero(message = "Cycling duration seconds cannot be negative")
    private Integer cyclingDurationSeconds;

    @PositiveOrZero(message = "Calories cannot be negative")
    private Integer calories;

    private java.time.Instant startedAt;
    private java.time.Instant endedAt;

    // Getters and Setters
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

    public Integer getWalkingDurationSeconds() { return walkingDurationSeconds; }
    public void setWalkingDurationSeconds(Integer walkingDurationSeconds) { this.walkingDurationSeconds = walkingDurationSeconds; }

    public Integer getJoggingDurationSeconds() { return joggingDurationSeconds; }
    public void setJoggingDurationSeconds(Integer joggingDurationSeconds) { this.joggingDurationSeconds = joggingDurationSeconds; }

    public Integer getRunningDurationSeconds() { return runningDurationSeconds; }
    public void setRunningDurationSeconds(Integer runningDurationSeconds) { this.runningDurationSeconds = runningDurationSeconds; }

    public Integer getCyclingDurationSeconds() { return cyclingDurationSeconds; }
    public void setCyclingDurationSeconds(Integer cyclingDurationSeconds) { this.cyclingDurationSeconds = cyclingDurationSeconds; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public java.time.Instant getStartedAt() { return startedAt; }
    public void setStartedAt(java.time.Instant startedAt) { this.startedAt = startedAt; }

    public java.time.Instant getEndedAt() { return endedAt; }
    public void setEndedAt(java.time.Instant endedAt) { this.endedAt = endedAt; }
}
