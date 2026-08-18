package com.stridemate.api.auth.controller;

import com.stridemate.api.auth.dto.AuthResponse;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.auth.dto.OtpRequest;
import com.stridemate.api.auth.dto.OtpVerifyRequest;
import com.stridemate.api.auth.dto.RegisterRequest;
import com.stridemate.api.auth.service.AuthService;
import com.stridemate.api.auth.service.OtpService;
import com.stridemate.api.user.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;
    private final com.stridemate.api.auth.service.PasswordResetService passwordResetService;

    @Autowired
    public AuthController(AuthService authService, OtpService otpService, com.stridemate.api.auth.service.PasswordResetService passwordResetService) {
        this.authService = authService;
        this.otpService = otpService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        java.util.Map<String, Object> response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(authService.getCurrentUser(email));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@Valid @RequestBody OtpRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        try {
            AuthResponse response = authService.verifyOtpAndAuthenticate(request.getEmail(), request.getOtp());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody OtpRequest request) {
        otpService.generateAndSendOtp(request.getEmail());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody com.stridemate.api.auth.dto.ForgotPasswordRequest request) {
        passwordResetService.processForgotPassword(request.getEmail());
        // Generic success message
        return ResponseEntity.ok("If an account exists for this email, a password reset link has been sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody com.stridemate.api.auth.dto.ResetPasswordRequest request) {
        try {
            passwordResetService.processResetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok("Password successfully reset.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
