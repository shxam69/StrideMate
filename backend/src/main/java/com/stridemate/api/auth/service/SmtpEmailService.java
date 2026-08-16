package com.stridemate.api.auth.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("prod")
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${mail.from}")
    private String fromEmail;

    @Autowired
    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        String resetUrl = "http://localhost:5173/reset-password?token=" + resetToken; // In real prod, this should be configurable
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("StrideMate - Password Reset Request");
        message.setText("Hello,\n\n" +
                "You have requested to reset your password. Please click the link below to set a new password:\n\n" +
                resetUrl + "\n\n" +
                "This link will expire in 15 minutes.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Thanks,\nThe StrideMate Team");
                
        mailSender.send(message);
    }
}
