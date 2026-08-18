package com.stridemate.api.safety.entity;

import com.stridemate.api.user.entity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "emergency_events", indexes = {
        @Index(name = "idx_emergency_events_user_id", columnList = "user_id"),
        @Index(name = "idx_emergency_events_triggered_at", columnList = "triggered_at"),
        @Index(name = "idx_emergency_events_status", columnList = "status"),
        @Index(name = "idx_emergency_events_sms_sid", columnList = "sms_sid"),
        @Index(name = "idx_emergency_events_client_request_id", columnList = "client_request_id")
})
public class EmergencyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "accuracy_meters")
    private Double accuracyMeters;

    @Column(name = "activity_id")
    private UUID activityId;

    @Column(name = "triggered_at", nullable = false)
    private Instant triggeredAt;

    @Column(name = "status", length = 50, nullable = false)
    private String status; // TRIGGERED, RESOLVED, FAILED, PARTIALLY_SENT, SENT

    @Column(name = "provider", length = 50)
    private String provider; // SPRINGEDGE, MOCK

    @Column(name = "sms_status", length = 50)
    private String smsStatus; // REQUESTED, ACCEPTED, SENT, DELIVERED, FAILED, UNAVAILABLE, SKIPPED, MOCK_SENT

    @Column(name = "whatsapp_status", length = 50)
    private String whatsappStatus;

    @Column(name = "call_status", length = 50)
    private String callStatus;

    @Column(name = "sms_sid", length = 100)
    private String smsSid;

    @Column(name = "whatsapp_sid", length = 100)
    private String whatsappSid;

    @Column(name = "call_sid", length = 100)
    private String callSid;

    @Column(name = "sms_error_code", length = 50)
    private String smsErrorCode;

    @Column(name = "sms_error_message", columnDefinition = "TEXT")
    private String smsErrorMessage;

    @Column(name = "whatsapp_error_code", length = 50)
    private String whatsappErrorCode;

    @Column(name = "whatsapp_error_message", columnDefinition = "TEXT")
    private String whatsappErrorMessage;

    @Column(name = "call_error_code", length = 50)
    private String callErrorCode;

    @Column(name = "call_error_message", columnDefinition = "TEXT")
    private String callErrorMessage;

    @Column(name = "client_request_id", length = 100)
    private String clientRequestId;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public EmergencyEvent() {}

    public EmergencyEvent(User user, Double latitude, Double longitude, Double accuracyMeters, UUID activityId, String message) {
        this(user, latitude, longitude, accuracyMeters, activityId, message, null);
    }

    public EmergencyEvent(User user, Double latitude, Double longitude, Double accuracyMeters, UUID activityId, String message, String clientRequestId) {
        this.user = user;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracyMeters = accuracyMeters;
        this.activityId = activityId;
        this.message = message;
        this.clientRequestId = clientRequestId;
        this.triggeredAt = Instant.now();
        this.status = "TRIGGERED";
        this.createdAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.triggeredAt == null) {
            this.triggeredAt = Instant.now();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

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

    public String getWhatsappSid() { return whatsappSid; }
    public void setWhatsappSid(String whatsappSid) { this.whatsappSid = whatsappSid; }

    public String getCallSid() { return callSid; }
    public void setCallSid(String callSid) { this.callSid = callSid; }

    public String getSmsErrorCode() { return smsErrorCode; }
    public void setSmsErrorCode(String smsErrorCode) { this.smsErrorCode = smsErrorCode; }

    public String getSmsErrorMessage() { return smsErrorMessage; }
    public void setSmsErrorMessage(String smsErrorMessage) { this.smsErrorMessage = smsErrorMessage; }

    public String getWhatsappErrorCode() { return whatsappErrorCode; }
    public void setWhatsappErrorCode(String whatsappErrorCode) { this.whatsappErrorCode = whatsappErrorCode; }

    public String getWhatsappErrorMessage() { return whatsappErrorMessage; }
    public void setWhatsappErrorMessage(String whatsappErrorMessage) { this.whatsappErrorMessage = whatsappErrorMessage; }

    public String getCallErrorCode() { return callErrorCode; }
    public void setCallErrorCode(String callErrorCode) { this.callErrorCode = callErrorCode; }

    public String getCallErrorMessage() { return callErrorMessage; }
    public void setCallErrorMessage(String callErrorMessage) { this.callErrorMessage = callErrorMessage; }

    public String getClientRequestId() { return clientRequestId; }
    public void setClientRequestId(String clientRequestId) { this.clientRequestId = clientRequestId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
