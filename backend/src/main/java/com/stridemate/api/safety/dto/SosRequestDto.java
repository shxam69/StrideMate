package com.stridemate.api.safety.dto;

import java.util.UUID;

public class SosRequestDto {
    private Double latitude;
    private Double longitude;
    private Double accuracyMeters;
    private UUID activityId;
    private String clientRequestId;

    public SosRequestDto() {}

    public SosRequestDto(Double latitude, Double longitude, Double accuracyMeters, UUID activityId) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracyMeters = accuracyMeters;
        this.activityId = activityId;
    }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(Double accuracyMeters) { this.accuracyMeters = accuracyMeters; }

    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }

    public String getClientRequestId() { return clientRequestId; }
    public void setClientRequestId(String clientRequestId) { this.clientRequestId = clientRequestId; }
}
