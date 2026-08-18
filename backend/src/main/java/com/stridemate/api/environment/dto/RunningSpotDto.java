package com.stridemate.api.environment.dto;

public class RunningSpotDto {
    private String name;
    private double latitude;
    private double longitude;
    private double distanceKm;
    private String type;
    private Long osmId;
    private double suitabilityScore;
    private String mapsUrl;

    public RunningSpotDto() {}

    public RunningSpotDto(String name, double latitude, double longitude, double distanceKm, String type, Long osmId, double suitabilityScore, String mapsUrl) {
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.distanceKm = distanceKm;
        this.type = type;
        this.osmId = osmId;
        this.suitabilityScore = suitabilityScore;
        this.mapsUrl = mapsUrl;
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

    public String getMapsUrl() { return mapsUrl; }
    public void setMapsUrl(String mapsUrl) { this.mapsUrl = mapsUrl; }
}
