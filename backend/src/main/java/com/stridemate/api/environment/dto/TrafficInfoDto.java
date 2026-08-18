package com.stridemate.api.environment.dto;

public class TrafficInfoDto {
    private String congestionLevel; // LOW, MODERATE, HEAVY, UNAVAILABLE
    private int congestionScore; // 0 (Gridlock) to 100 (Free flow)
    private String description;
    private String provider;
    private boolean available;

    public TrafficInfoDto() {}

    public TrafficInfoDto(String congestionLevel, int congestionScore, String description, String provider, boolean available) {
        this.congestionLevel = congestionLevel;
        this.congestionScore = congestionScore;
        this.description = description;
        this.provider = provider;
        this.available = available;
    }

    public static TrafficInfoDto unavailable(String reason) {
        return new TrafficInfoDto("UNAVAILABLE", 80, reason != null ? reason : "Live traffic telemetry unavailable", "None", false);
    }

    public String getCongestionLevel() { return congestionLevel; }
    public void setCongestionLevel(String congestionLevel) { this.congestionLevel = congestionLevel; }

    public int getCongestionScore() { return congestionScore; }
    public void setCongestionScore(int congestionScore) { this.congestionScore = congestionScore; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}
