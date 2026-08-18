package com.stridemate.api.user.service;

import com.stridemate.api.user.dto.UpdateProfileRequest;
import com.stridemate.api.user.dto.UserDto;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.EmergencyContactRepository;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    @Autowired
    public UserService(UserRepository userRepository, EmergencyContactRepository emergencyContactRepository) {
        this.userRepository = userRepository;
        this.emergencyContactRepository = emergencyContactRepository;
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        return toDto(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));

        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }

        User saved = userRepository.save(user);
        return toDto(saved);
    }

    public UserDto toDto(User user) {
        boolean hasDob = user.getDateOfBirth() != null;
        boolean hasEmergencyContact = emergencyContactRepository.existsByUser(user);
        boolean profileCompleted = hasDob && hasEmergencyContact;

        return new UserDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.isPhoneVerified(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getProfilePhoto(),
                profileCompleted,
                user.getRole()
        );
    }
}
