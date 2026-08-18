package com.stridemate.api.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class DevEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(DevEmailService.class);

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
        log.info("[DEV EMAIL] Password Reset requested for {}: Link={}", toEmail, resetUrl);
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("[DEV EMAIL] OTP requested for {}: OTP={}", toEmail, otp);
    }
}
