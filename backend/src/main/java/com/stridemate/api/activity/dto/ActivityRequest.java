package com.stridemate.api.activity.dto;

import com.stridemate.api.activity.entity.SportType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public class ActivityRequest {

    @NotNull(message = "Sport type is required")
    private SportType sport;

    @PositiveOrZero(message = "Distance cannot be negative")
    private BigDecimal distanceKm;

    @PositiveOrZero(message = "Duration minutes cannot be negative")
    private Integer durationMinutes;

    @PositiveOrZero(message = "Duration seconds cannot be negative")
    private Integer durationSeconds;

    @PositiveOrZero(message = "Steps cannot be negative")
    private Integer steps;

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
}
