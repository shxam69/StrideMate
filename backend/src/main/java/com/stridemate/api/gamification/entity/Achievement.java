package com.stridemate.api.gamification.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "achievements")
public class Achievement {

    @Id
    @Column(length = 100)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 100)
    private String icon;

    @Column(name = "reward_xp", nullable = false)
    private int rewardXp;

    @Column(name = "requirement_description", nullable = false)
    private String requirementDescription;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Achievement() {
    }

    public Achievement(String code, String name, String description, String icon, int rewardXp, String requirementDescription) {
        this.code = code;
        this.name = name;
        this.description = description;
        this.icon = icon;
        this.rewardXp = rewardXp;
        this.requirementDescription = requirementDescription;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public int getRewardXp() {
        return rewardXp;
    }

    public void setRewardXp(int rewardXp) {
        this.rewardXp = rewardXp;
    }

    public String getRequirementDescription() {
        return requirementDescription;
    }

    public void setRequirementDescription(String requirementDescription) {
        this.requirementDescription = requirementDescription;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
