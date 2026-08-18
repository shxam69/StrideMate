package com.stridemate.api.activity.dto;

import java.time.Instant;

public class RoutePointDto {
    private Double latitude;
    private Double longitude;
    private Double accuracy;
    private Double speed;
    private Instant recordedAt;

    public RoutePointDto() {}

    public RoutePointDto(Double latitude, Double longitude, Double accuracy, Double speed, Instant recordedAt) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracy = accuracy;
        this.speed = speed;
        this.recordedAt = recordedAt;
    }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }

    public Double getSpeed() { return speed; }
    public void setSpeed(Double speed) { this.speed = speed; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
}
