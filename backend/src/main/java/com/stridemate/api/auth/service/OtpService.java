package com.stridemate.api.auth.service;

import com.stridemate.api.auth.entity.OtpEntity;
import com.stridemate.api.auth.repository.OtpRepository;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public OtpService(OtpRepository otpRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void generateAndSendOtp(String phoneNumber) {
        Optional<OtpEntity> recentOtpOpt = otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(phoneNumber);
        if (recentOtpOpt.isPresent()) {
            if (Instant.now().isBefore(recentOtpOpt.get().getCreatedAt().plus(60, ChronoUnit.SECONDS))) {
                throw new com.stridemate.api.exception.RateLimitException("Please wait 60 seconds before requesting a new OTP");
            }
        }

        // Generate a 4-digit OTP
        int otpValue = 1000 + secureRandom.nextInt(9000); // 1000 to 9999
        String otpStr = String.valueOf(otpValue);

        // Store OTP hash
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setPhoneNumber(phoneNumber);
        otpEntity.setOtpHash(passwordEncoder.encode(otpStr));
        otpEntity.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        otpRepository.save(otpEntity);

        // DEV ONLY: Log plaintext OTP
        System.out.println("[DEV OTP] phone=" + phoneNumber + " otp=" + otpStr);
    }

    public boolean verifyOtp(String phoneNumber, String otpCode) {
        Optional<OtpEntity> latestOtpOpt = otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(phoneNumber);
        
        if (latestOtpOpt.isEmpty()) {
            return false;
        }

        OtpEntity latestOtp = latestOtpOpt.get();

        // Check if verified
        if (latestOtp.isVerified()) {
            return false;
        }

        // Check expiration
        if (Instant.now().isAfter(latestOtp.getExpiresAt())) {
            return false;
        }

        // Verify hash
        if (!passwordEncoder.matches(otpCode, latestOtp.getOtpHash())) {
            return false;
        }

        // Mark OTP as used/verified
        latestOtp.setVerified(true);
        otpRepository.save(latestOtp);

        // Update user if they exist with this phone number
        userRepository.findByPhoneNumber(phoneNumber).ifPresent(user -> {
            user.setPhoneVerified(true);
            userRepository.save(user);
        });

        return true;
    }
}
