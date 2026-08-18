package com.stridemate.api.environment.dto;

import java.util.ArrayList;
import java.util.List;

public class EnvironmentResponseDto {
    private LocationDto location;
    private WeatherDto weather;
    private AirQualityDto airQuality;
    private Double uvIndex;
    private String condition; // EXCELLENT, GOOD, MODERATE, POOR, AVOID
    private int runningScore; // 0 - 100
    private String recommendation;
    private List<RunningSpotDto> nearbySpots = new ArrayList<>();

    public EnvironmentResponseDto() {}

    public LocationDto getLocation() { return location; }
    public void setLocation(LocationDto location) { this.location = location; }

    public WeatherDto getWeather() { return weather; }
    public void setWeather(WeatherDto weather) { this.weather = weather; }

    public AirQualityDto getAirQuality() { return airQuality; }
    public void setAirQuality(AirQualityDto airQuality) { this.airQuality = airQuality; }

    public Double getUvIndex() { return uvIndex; }
    public void setUvIndex(Double uvIndex) { this.uvIndex = uvIndex; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }

    public int getRunningScore() { return runningScore; }
    public void setRunningScore(int runningScore) { this.runningScore = runningScore; }

    public String getRecommendation() { return recommendation; }
    public void setRecommendation(String recommendation) { this.recommendation = recommendation; }

    public List<RunningSpotDto> getNearbySpots() { return nearbySpots; }
    public void setNearbySpots(List<RunningSpotDto> nearbySpots) { this.nearbySpots = nearbySpots; }
}
