package com.stridemate.api.auth.service;

public interface EmailService {
    void sendPasswordResetEmail(String toEmail, String resetToken);
    void sendOtpEmail(String toEmail, String otp);
}
