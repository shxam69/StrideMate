package com.stridemate.api.user.dto;

import com.stridemate.api.user.entity.Role;
import java.time.LocalDate;
import java.util.UUID;

public class UserDto {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private boolean phoneVerified;
    private LocalDate dateOfBirth;
    private String gender;
    private String profilePhoto;
    private boolean profileCompleted;
    private Role role;

    public UserDto() {}

    public UserDto(UUID id, String firstName, String lastName, String email, String phoneNumber, 
                   boolean phoneVerified, LocalDate dateOfBirth, String gender, String profilePhoto, 
                   boolean profileCompleted, Role role) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.phoneVerified = phoneVerified;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.profilePhoto = profilePhoto;
        this.profileCompleted = profileCompleted;
        this.role = role;
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    
    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }

    public boolean isProfileCompleted() { return profileCompleted; }
    public void setProfileCompleted(boolean profileCompleted) { this.profileCompleted = profileCompleted; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
