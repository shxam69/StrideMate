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
        @Index(name = "idx_emergency_events_status", columnList = "status")
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
    private String status; // TRIGGERED, RESOLVED, FAILED

    @Column(name = "sms_status", length = 50)
    private String smsStatus; // SENT, FAILED, SKIPPED, MOCK_SENT

    @Column(name = "whatsapp_status", length = 50)
    private String whatsappStatus; // SENT, FAILED, SKIPPED, MOCK_SENT

    @Column(name = "call_status", length = 50)
    private String callStatus; // SENT, FAILED, SKIPPED, MOCK_SENT

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public EmergencyEvent() {}

    public EmergencyEvent(User user, Double latitude, Double longitude, Double accuracyMeters, UUID activityId, String message) {
        this.user = user;
        this.latitude = latitude;
        this.longitude = longitude;
        this.accuracyMeters = accuracyMeters;
        this.activityId = activityId;
        this.message = message;
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

    public String getSmsStatus() { return smsStatus; }
    public void setSmsStatus(String smsStatus) { this.smsStatus = smsStatus; }

    public String getWhatsappStatus() { return whatsappStatus; }
    public void setWhatsappStatus(String whatsappStatus) { this.whatsappStatus = whatsappStatus; }

    public String getCallStatus() { return callStatus; }
    public void setCallStatus(String callStatus) { this.callStatus = callStatus; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
