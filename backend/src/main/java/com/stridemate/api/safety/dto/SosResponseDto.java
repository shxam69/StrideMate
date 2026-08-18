package com.stridemate.api.safety.dto;

import java.time.Instant;
import java.util.UUID;

public class SosResponseDto {
    private UUID eventId;
    private String status; // SENT, PARTIALLY_SENT, FAILED, ACCEPTED, REQUESTED
    private String provider; // SPRINGEDGE, MOCK
    private String locationUrl;
    private String sms; // REQUESTED, ACCEPTED, SENT, DELIVERED, FAILED, UNAVAILABLE, SKIPPED, MOCK_SENT
    private String whatsapp;
    private String call;
    private String smsSid;
    private String smsErrorCode;
    private String smsErrorMessage;
    private String message;
    private Instant triggeredAt;
    private String contactName;
    private String contactPhone;

    public SosResponseDto() {}

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getLocationUrl() { return locationUrl; }
    public void setLocationUrl(String locationUrl) { this.locationUrl = locationUrl; }

    public String getSms() { return sms; }
    public void setSms(String sms) { this.sms = sms; }

    public String getWhatsapp() { return whatsapp; }
    public void setWhatsapp(String whatsapp) { this.whatsapp = whatsapp; }

    public String getCall() { return call; }
    public void setCall(String call) { this.call = call; }

    public String getSmsSid() { return smsSid; }
    public void setSmsSid(String smsSid) { this.smsSid = smsSid; }

    public String getSmsErrorCode() { return smsErrorCode; }
    public void setSmsErrorCode(String smsErrorCode) { this.smsErrorCode = smsErrorCode; }

    public String getSmsErrorMessage() { return smsErrorMessage; }
    public void setSmsErrorMessage(String smsErrorMessage) { this.smsErrorMessage = smsErrorMessage; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(Instant triggeredAt) { this.triggeredAt = triggeredAt; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
}
