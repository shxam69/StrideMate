package com.stridemate.api.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@Profile("prod")
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${mail.from}")
    private String fromEmail;

    @Value("${frontend.url:https://stride-mate-eight.vercel.app}")
    private String frontendUrl;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {

        String html = """
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: 40px auto;
                    padding: 30px;
                    background: #0f0b1a;
                    color: #ffffff;
                    border-radius: 16px;
                ">

                    <h2 style="color: #a855f7;">
                        StrideMate
                    </h2>

                    <p>
                        Your verification code is:
                    </p>

                    <div style="
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        text-align: center;
                        padding: 20px;
                        margin: 25px 0;
                        background: #1e1533;
                        border-radius: 12px;
                        color: #c084fc;
                    ">
                        %s
                    </div>

                    <p>
                        This code expires in
                        <strong>5 minutes</strong>.
                    </p>

                    <p style="color: #a1a1aa;">
                        If you did not request this code,
                        you can safely ignore this email.
                    </p>

                    <p>
                        Thanks,<br>
                        The StrideMate Team
                    </p>

                </div>
                """.formatted(otp);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("StrideMate verification code");
            helper.setText(html, true);

            mailSender.send(message);

            System.out.println(
                    "OTP email sent successfully to: " + toEmail
            );

        } catch (MessagingException e) {

            System.err.println(
                    "Failed to send OTP email to "
                            + toEmail + ": "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Failed to send OTP email",
                    e
            );
        }
    }

    @Override
    public void sendPasswordResetEmail(
            String toEmail,
            String resetToken
    ) {

        String resetUrl =
                frontendUrl + "/reset-password?token=" + resetToken;

        String html = """
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 500px;
                    margin: 40px auto;
                    padding: 30px;
                    background: #0f0b1a;
                    color: #ffffff;
                    border-radius: 16px;
                ">

                    <h2 style="color: #a855f7;">
                        StrideMate
                    </h2>

                    <p>
                        You requested to reset your StrideMate password.
                    </p>

                    <p>
                        <a href="%s"
                           style="
                               display: inline-block;
                               padding: 12px 20px;
                               background: #7c3aed;
                               color: white;
                               text-decoration: none;
                               border-radius: 8px;
                               font-weight: bold;
                           ">
                            Reset Password
                        </a>
                    </p>

                    <p>
                        This link expires in
                        <strong>15 minutes</strong>.
                    </p>

                    <p style="color: #a1a1aa;">
                        If you did not request this password reset,
                        you can safely ignore this email.
                    </p>

                    <p>
                        Thanks,<br>
                        The StrideMate Team
                    </p>

                </div>
                """.formatted(resetUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("StrideMate - Password Reset Request");
            helper.setText(html, true);

            mailSender.send(message);

            System.out.println(
                    "Password reset email sent successfully to: "
                            + toEmail
            );

        } catch (MessagingException e) {

            System.err.println(
                    "Failed to send password reset email to "
                            + toEmail + ": "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Failed to send password reset email",
                    e
            );
        }
    }
}