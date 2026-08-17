package com.stridemate.api.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
@Service
@Profile("prod")
public class ResendEmailService implements EmailService {

    private static final String FROM_EMAIL =
            "StrideMate <onboarding@resend.dev>";

    private final Resend resend;

    @Value("${frontend.url:https://stride-mate-eight.vercel.app}")
    private String frontendUrl;

    public ResendEmailService(
            @Value("${RESEND_API_KEY}") String apiKey
    ) {
        this.resend = new Resend(apiKey);
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

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(FROM_EMAIL)
                .to(toEmail)
                .subject("StrideMate verification code")
                .html(html)
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(params);

            System.out.println(
                    "OTP email sent successfully. Resend ID: "
                            + response.getId()
            );

        } catch (ResendException e) {

            System.err.println(
                    "Failed to send OTP email: "
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

        CreateEmailOptions params = CreateEmailOptions.builder()
                .from(FROM_EMAIL)
                .to(toEmail)
                .subject("StrideMate - Password Reset Request")
                .html(html)
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(params);

            System.out.println(
                    "Password reset email sent successfully. Resend ID: "
                            + response.getId()
            );

        } catch (ResendException e) {

            System.err.println(
                    "Failed to send password reset email: "
                            + e.getMessage()
            );

            throw new RuntimeException(
                    "Failed to send password reset email",
                    e
            );
        }
    }
}