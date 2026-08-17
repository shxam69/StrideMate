package com.stridemate.api.auth.service;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!prod")
public class DevEmailService implements EmailService {

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken;
        System.out.println("==========================================================");
        System.out.println("[DEV EMAIL] Password Reset Requested");
        System.out.println("To: " + toEmail);
        System.out.println("Link: " + resetUrl);
        System.out.println("Token: " + resetToken);
        System.out.println("==========================================================");
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("==========================================================");
        System.out.println("[DEV EMAIL] OTP Requested");
        System.out.println("To: " + toEmail);
        System.out.println("OTP: " + otp);
        System.out.println("==========================================================");
    }
}
