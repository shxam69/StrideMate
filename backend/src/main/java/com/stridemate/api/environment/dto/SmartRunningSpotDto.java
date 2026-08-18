package com.stridemate.api.environment.dto;

import java.util.ArrayList;
import java.util.List;

public class SmartRunningSpotDto {
    private String name;
    private double latitude;
    private double longitude;
    private double distanceKm;
    private String type;
    private Long osmId;
    private double suitabilityScore; // 0 - 100
    private String suitabilityTier; // RECOMMENDED, MODERATE, AVOID
    private String mapsUrl;
    private String routeUrl;
    private TrafficInfoDto trafficInfo;
    private List<String> highlights = new ArrayList<>();
    private List<String> cautions = new ArrayList<>();

    public SmartRunningSpotDto() {}

    public SmartRunningSpotDto(String name, double latitude, double longitude, double distanceKm, String type, Long osmId, double suitabilityScore, String suitabilityTier, String mapsUrl, String routeUrl) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceKm = distanceKm;
        this.type = type;
        this.osmId = osmId;
        this.suitabilityScore = suitabilityScore;
        this.suitabilityTier = suitabilityTier;
        this.mapsUrl = mapsUrl;
        this.routeUrl = routeUrl;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getOsmId() { return osmId; }
    public void setOsmId(Long osmId) { this.osmId = osmId; }

    public double getSuitabilityScore() { return suitabilityScore; }
    public void setSuitabilityScore(double suitabilityScore) { this.suitabilityScore = suitabilityScore; }

    public String getSuitabilityTier() { return suitabilityTier; }
    public void setSuitabilityTier(String suitabilityTier) { this.suitabilityTier = suitabilityTier; }

    public String getMapsUrl() { return mapsUrl; }
    public void setMapsUrl(String mapsUrl) { this.mapsUrl = mapsUrl; }

    public String getRouteUrl() { return routeUrl; }
    public void setRouteUrl(String routeUrl) { this.routeUrl = routeUrl; }

    public TrafficInfoDto getTrafficInfo() { return trafficInfo; }
    public void setTrafficInfo(TrafficInfoDto trafficInfo) { this.trafficInfo = trafficInfo; }

    public List<String> getHighlights() { return highlights; }
    public void setHighlights(List<String> highlights) { this.highlights = highlights; }

    public List<String> getCautions() { return cautions; }
    public void setCautions(List<String> cautions) { this.cautions = cautions; }
}
