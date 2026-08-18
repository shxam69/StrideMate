package com.stridemate.api.safety.dto;

import java.time.Instant;
import java.util.UUID;

public class EmergencyEventDto {
    private UUID id;
    private Double latitude;
    private Double longitude;
    private Double accuracyMeters;
    private UUID activityId;
    private Instant triggeredAt;
    private String status;
    private String provider;
    private String smsStatus;
    private String whatsappStatus;
    private String callStatus;
    private String smsSid;
    private String smsErrorCode;
    private String smsErrorMessage;
    private String message;
    private Instant resolvedAt;

    public EmergencyEventDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getAccuracyMeters() { return accuracyMeters; }
    public void setAccuracyMeters(Double accuracyMeters) { this.accuracyMeters = accuracyMeters; }

    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }

    public Instant getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(Instant triggeredAt) { this.triggeredAt = triggeredAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getSmsStatus() { return smsStatus; }
    public void setSmsStatus(String smsStatus) { this.smsStatus = smsStatus; }

    public String getWhatsappStatus() { return whatsappStatus; }
    public void setWhatsappStatus(String whatsappStatus) { this.whatsappStatus = whatsappStatus; }

    public String getCallStatus() { return callStatus; }
    public void setCallStatus(String callStatus) { this.callStatus = callStatus; }

    public String getSmsSid() { return smsSid; }
    public void setSmsSid(String smsSid) { this.smsSid = smsSid; }

    public String getSmsErrorCode() { return smsErrorCode; }
    public void setSmsErrorCode(String smsErrorCode) { this.smsErrorCode = smsErrorCode; }

    public String getSmsErrorMessage() { return smsErrorMessage; }
    public void setSmsErrorMessage(String smsErrorMessage) { this.smsErrorMessage = smsErrorMessage; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
}
