package com.stridemate.api.environment.dto;

import java.util.ArrayList;
import java.util.List;

public class SmartMapResponseDto {
    private LocationDto userLocation;
    private String overallCondition; // EXCELLENT, GOOD, MODERATE, POOR, AVOID
    private int overallRunningScore; // 0 - 100
    private String summaryRecommendation;
    private SmartRunningSpotDto bestPlace;
    private List<SmartRunningSpotDto> nearbySpots = new ArrayList<>();
    private WeatherDto weather;
    private AirQualityDto airQuality;
    private TrafficInfoDto traffic;

    public SmartMapResponseDto() {}

    public LocationDto getUserLocation() { return userLocation; }
    public void setUserLocation(LocationDto userLocation) { this.userLocation = userLocation; }

    public String getOverallCondition() { return overallCondition; }
    public void setOverallCondition(String overallCondition) { this.overallCondition = overallCondition; }

    public int getOverallRunningScore() { return overallRunningScore; }
    public void setOverallRunningScore(int overallRunningScore) { this.overallRunningScore = overallRunningScore; }

    public String getSummaryRecommendation() { return summaryRecommendation; }
    public void setSummaryRecommendation(String summaryRecommendation) { this.summaryRecommendation = summaryRecommendation; }

    public SmartRunningSpotDto getBestPlace() { return bestPlace; }
    public void setBestPlace(SmartRunningSpotDto bestPlace) { this.bestPlace = bestPlace; }

    public List<SmartRunningSpotDto> getNearbySpots() { return nearbySpots; }
    public void setNearbySpots(List<SmartRunningSpotDto> nearbySpots) { this.nearbySpots = nearbySpots; }

    public WeatherDto getWeather() { return weather; }
    public void setWeather(WeatherDto weather) { this.weather = weather; }

    public AirQualityDto getAirQuality() { return airQuality; }
    public void setAirQuality(AirQualityDto airQuality) { this.airQuality = airQuality; }

    public TrafficInfoDto getTraffic() { return traffic; }
    public void setTraffic(TrafficInfoDto traffic) { this.traffic = traffic; }
}
