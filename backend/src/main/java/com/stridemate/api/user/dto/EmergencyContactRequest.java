package com.stridemate.api.user.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class EmergencyContactRequest {
    
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Relationship is required")
    private String relationship;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @JsonProperty("isPrimary")
    @JsonAlias({"primary", "isPrimary"})
    private boolean isPrimary;

    public EmergencyContactRequest() {}

    public EmergencyContactRequest(String name, String relationship, String phoneNumber, boolean isPrimary) {
        this.name = name;
        this.relationship = relationship;
        this.phoneNumber = phoneNumber;
        this.isPrimary = isPrimary;
    }

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
}
