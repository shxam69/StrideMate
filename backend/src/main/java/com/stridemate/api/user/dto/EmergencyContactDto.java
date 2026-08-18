package com.stridemate.api.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;

public class EmergencyContactDto {
    private UUID id;
    private String name;
    private String relationship;
    private String phoneNumber;

    @JsonProperty("isPrimary")
    @JsonAlias({"primary", "isPrimary"})
    private boolean isPrimary;

    private Instant createdAt;
    private Instant updatedAt;

    public EmergencyContactDto() {}

    public EmergencyContactDto(UUID id, String name, String relationship, String phoneNumber, boolean isPrimary, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.name = name;
        this.relationship = relationship;
        this.phoneNumber = phoneNumber;
        this.isPrimary = isPrimary;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    @JsonProperty("isPrimary")
    public boolean isPrimary() { return isPrimary; }

    @JsonProperty("isPrimary")
    public void setPrimary(boolean primary) { isPrimary = primary; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
