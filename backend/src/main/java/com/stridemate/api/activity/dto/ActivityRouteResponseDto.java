package com.stridemate.api.activity.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class ActivityRouteResponseDto {
    private UUID activityId;
    private String sport;
    private BigDecimal distanceKm;
    private Integer durationSeconds;
    private Integer calories;
    private Integer scorePoints;
    private boolean privacyTrimmed;
    private List<RoutePointDto> points = new ArrayList<>();

    public ActivityRouteResponseDto() {}

    public ActivityRouteResponseDto(
            UUID activityId, 
            String sport, 
            BigDecimal distanceKm, 
            Integer durationSeconds, 
            Integer calories, 
            Integer scorePoints, 
            boolean privacyTrimmed, 
            List<RoutePointDto> points) {
        this.activityId = activityId;
        this.sport = sport;
        this.distanceKm = distanceKm;
        this.durationSeconds = durationSeconds;
        this.calories = calories;
        this.scorePoints = scorePoints;
        this.privacyTrimmed = privacyTrimmed;
        this.points = points != null ? points : new ArrayList<>();
    }

    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Integer getScorePoints() { return scorePoints; }
    public void setScorePoints(Integer scorePoints) { this.scorePoints = scorePoints; }

    public boolean isPrivacyTrimmed() { return privacyTrimmed; }
    public void setPrivacyTrimmed(boolean privacyTrimmed) { this.privacyTrimmed = privacyTrimmed; }

    public List<RoutePointDto> getPoints() { return points; }
    public void setPoints(List<RoutePointDto> points) { this.points = points; }
}
