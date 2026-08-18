package com.stridemate.api.activity.entity;

import com.stridemate.api.user.entity.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activities")
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SportType sport;

    @Column(precision = 10, scale = 4)
    private BigDecimal distanceKm;

    private Integer durationMinutes;
    private Integer durationSeconds;
    private Integer steps;

    @Column(name = "total_duration_seconds")
    private Integer totalDurationSeconds;

    @Column(name = "walking_duration_seconds")
    private Integer walkingDurationSeconds;

    @Column(name = "jogging_duration_seconds")
    private Integer joggingDurationSeconds;

    @Column(name = "running_duration_seconds")
    private Integer runningDurationSeconds;

    @Column(name = "cycling_duration_seconds")
    private Integer cyclingDurationSeconds;

    @Column(name = "calories")
    private Integer calories;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(nullable = false)
    private Integer points;

    @Column(nullable = false)
    private Instant recordedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        if (this.recordedAt == null) {
            this.recordedAt = Instant.now();
        }
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public SportType getSport() { return sport; }
    public void setSport(SportType sport) { this.sport = sport; }

    public BigDecimal getDistanceKm() { return distanceKm; }
    public void setDistanceKm(BigDecimal distanceKm) { this.distanceKm = distanceKm; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Integer getSteps() { return steps; }
    public void setSteps(Integer steps) { this.steps = steps; }

    public Integer getTotalDurationSeconds() { return totalDurationSeconds; }
    public void setTotalDurationSeconds(Integer totalDurationSeconds) { this.totalDurationSeconds = totalDurationSeconds; }

    public Integer getWalkingDurationSeconds() { return walkingDurationSeconds; }
    public void setWalkingDurationSeconds(Integer walkingDurationSeconds) { this.walkingDurationSeconds = walkingDurationSeconds; }

    public Integer getJoggingDurationSeconds() { return joggingDurationSeconds; }
    public void setJoggingDurationSeconds(Integer joggingDurationSeconds) { this.joggingDurationSeconds = joggingDurationSeconds; }

    public Integer getRunningDurationSeconds() { return runningDurationSeconds; }
    public void setRunningDurationSeconds(Integer runningDurationSeconds) { this.runningDurationSeconds = runningDurationSeconds; }

    public Integer getCyclingDurationSeconds() { return cyclingDurationSeconds; }
    public void setCyclingDurationSeconds(Integer cyclingDurationSeconds) { this.cyclingDurationSeconds = cyclingDurationSeconds; }

    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getEndedAt() { return endedAt; }
    public void setEndedAt(Instant endedAt) { this.endedAt = endedAt; }

    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
