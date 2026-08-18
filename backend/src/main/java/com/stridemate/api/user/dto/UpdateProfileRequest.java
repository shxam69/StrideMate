package com.stridemate.api.user.dto;

import java.time.LocalDate;

public class UpdateProfileRequest {
    private LocalDate dateOfBirth;
    private String gender;
    private String profilePhoto;

    public UpdateProfileRequest() {}

    public UpdateProfileRequest(LocalDate dateOfBirth, String gender, String profilePhoto) {
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.profilePhoto = profilePhoto;
    }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
}
