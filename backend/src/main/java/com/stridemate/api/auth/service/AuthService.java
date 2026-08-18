package com.stridemate.api.auth.service;

import com.stridemate.api.auth.dto.AuthResponse;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.auth.dto.RegisterRequest;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.exception.DuplicateResourceException;
import com.stridemate.api.user.dto.UserDto;
import com.stridemate.api.user.entity.Role;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final com.stridemate.api.user.service.UserService userService;
    private final OtpService otpService;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                       AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                       UserDetailsService userDetailsService,
                       com.stridemate.api.user.service.UserService userService,
                       OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userService = userService;
        this.otpService = otpService;
    }

    public java.util.Map<String, Object> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }

        if (userRepository.existsByFirstNameIgnoreCaseAndLastNameIgnoreCase(request.getFirstName(), request.getLastName())) {
            throw new DuplicateResourceException("User with this first and last name already exists");
        }

        String normalizedPhone = request.getPhoneNumber();
        if (normalizedPhone != null) {
            normalizedPhone = normalizedPhone.trim().replaceAll("\\s+", "");
        }

        if (normalizedPhone != null && userRepository.existsByPhoneNumber(normalizedPhone)) {
            throw new DuplicateResourceException("Phone number is already registered");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(normalizedPhone);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.USER);

        User savedUser = userRepository.save(user);

        // Generate and send initial OTP automatically
        try {
            otpService.generateAndSendOtp(savedUser.getEmail());
        } catch (Exception e) {
            // Log but don't fail user creation if SMTP temporary issue occurs
        }

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("message", "User registered successfully. Please verify your email.");
        response.put("email", savedUser.getEmail());
        response.put("user", toDto(savedUser));
        return response;
    }

    public AuthResponse verifyOtpAndAuthenticate(String email, String otpCode) {
        logger.info("[OTP] verification started for user {}", email);

        if (email == null || otpCode == null || otpCode.trim().length() != 6) {
            logger.warn("[OTP] invalid input format for user {}", email);
            throw new IllegalArgumentException("Invalid, expired, or already used OTP");
        }

        String normalizedEmail = email.trim().toLowerCase();
        boolean isValid = otpService.verifyOtp(normalizedEmail, otpCode.trim());
        if (!isValid) {
            logger.warn("[OTP] verification failed (invalid/expired/reused) for user {}", normalizedEmail);
            throw new IllegalArgumentException("Invalid, expired, or already used OTP");
        }

        logger.info("[OTP] OTP valid for user {}", normalizedEmail);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        logger.info("[OTP] user emailVerified={} for user {}", user.isEmailVerified(), normalizedEmail);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        logger.info("[OTP] JWT generated successfully for user {}", normalizedEmail);

        UserDto dto = toDto(user);
        logger.info("[OTP] returning AuthResponse: profileCompleted={} for user {}", dto.isProfileCompleted(), normalizedEmail);

        return new AuthResponse(token, dto);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        return new AuthResponse(token, toDto(user));
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return toDto(user);
    }

    private UserDto toDto(User user) {
        return userService.toDto(user);
    }
}
