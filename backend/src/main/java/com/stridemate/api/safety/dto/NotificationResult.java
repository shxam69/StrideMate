package com.stridemate.api.safety.dto;

import java.time.Instant;

public class NotificationResult {
    private String provider;
    private String status; // REQUESTED, ACCEPTED, SENT, DELIVERED, INITIATED, RINGING, COMPLETED, FAILED, UNAVAILABLE, SKIPPED, MOCK_SENT
    private String sid; // Provider Message ID or Call ID
    private String errorCode;
    private String errorMessage;
    private Instant timestamp;

    public NotificationResult() {
        this.timestamp = Instant.now();
    }

    public NotificationResult(String provider, String status, String sid, String errorCode, String errorMessage) {
        this.provider = provider;
        this.status = status;
        this.sid = sid;
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.timestamp = Instant.now();
    }

    public static NotificationResult mockSent(String channel) {
        return new NotificationResult("MOCK", "MOCK_SENT", "mock-" + channel + "-" + System.currentTimeMillis(), null, null);
    }

    public static NotificationResult unavailable(String provider, String reason) {
        return new NotificationResult(provider, "UNAVAILABLE", null, "CONFIG_MISSING", reason);
    }

    public static NotificationResult skipped(String reason) {
        return new NotificationResult("NONE", "SKIPPED", null, null, reason);
    }

    public static NotificationResult failed(String provider, String errorCode, String errorMessage) {
        return new NotificationResult(provider, "FAILED", null, errorCode, errorMessage);
    }

    public static NotificationResult success(String provider, String status, String sid) {
        return new NotificationResult(provider, status, sid, null, null);
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSid() { return sid; }
    public void setSid(String sid) { this.sid = sid; }

    public String getErrorCode() { return errorCode; }
    public void setErrorCode(String errorCode) { this.errorCode = errorCode; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
