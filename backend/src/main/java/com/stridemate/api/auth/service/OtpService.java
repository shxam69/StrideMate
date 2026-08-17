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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private final OtpRepository otpRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    public OtpService(OtpRepository otpRepository, UserRepository userRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void generateAndSendOtp(String email) {
        Optional<OtpEntity> recentOtpOpt = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email);
        if (recentOtpOpt.isPresent()) {
            if (Instant.now().isBefore(recentOtpOpt.get().getCreatedAt().plus(60, ChronoUnit.SECONDS))) {
                throw new com.stridemate.api.exception.RateLimitException("Please wait 60 seconds before requesting a new OTP");
            }
        }

        // Generate a 6-digit OTP
        int otpValue = 100000 + secureRandom.nextInt(900000); // 100000 to 999999
        String otpStr = String.valueOf(otpValue);
        logger.info("Generated new OTP for user {}", email);

        // Store OTP hash
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setEmail(email);
        otpEntity.setOtpHash(passwordEncoder.encode(otpStr));
        otpEntity.setExpiresAt(Instant.now().plus(5, ChronoUnit.MINUTES));
        otpEntity.setAttempts(0);
        otpRepository.save(otpEntity);
        logger.info("Persisted OTP hash for user {}", email);

        // Send via SMTP
        try {
            logger.info("Starting email-send for user {}", email);
            emailService.sendOtpEmail(email, otpStr);
            logger.info("Completed email-send successfully for user {}", email);
        } catch (Exception e) {
            logger.error("Failed email-send for user {}: {}", email, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again later.");
        }
    }

    public boolean verifyOtp(String email, String otpCode) {
        Optional<OtpEntity> latestOtpOpt = otpRepository.findTopByEmailAndVerifiedFalseOrderByCreatedAtDesc(email);
        
        if (latestOtpOpt.isEmpty()) {
            return false;
        }

        OtpEntity latestOtp = latestOtpOpt.get();

        // Check if max attempts reached
        if (latestOtp.getAttempts() >= 5) {
            return false;
        }

        // Check expiration
        if (Instant.now().isAfter(latestOtp.getExpiresAt())) {
            return false;
        }

        // Verify hash
        if (!passwordEncoder.matches(otpCode, latestOtp.getOtpHash())) {
            latestOtp.setAttempts(latestOtp.getAttempts() + 1);
            otpRepository.save(latestOtp);
            return false;
        }

        // Mark OTP as used/verified
        latestOtp.setVerified(true);
        otpRepository.save(latestOtp);

        // Update user
        userRepository.findByEmail(email).ifPresent(user -> {
            user.setEmailVerified(true);
            userRepository.save(user);
        });

        return true;
    }
}
