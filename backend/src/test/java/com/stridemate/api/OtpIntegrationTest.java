package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.auth.dto.OtpRequest;
import com.stridemate.api.auth.dto.OtpVerifyRequest;
import com.stridemate.api.auth.dto.RegisterRequest;
import com.stridemate.api.auth.entity.OtpEntity;
import com.stridemate.api.auth.repository.OtpRepository;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class OtpIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper = new ObjectMapper();
    private HttpClient httpClient;

    @BeforeEach
    public void setup() {
        httpClient = HttpClient.newHttpClient();
        otpRepository.deleteAll();
        activityRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/auth";
    }

    private String createTestUserAndGetPhone() throws Exception {
        RegisterRequest registerReq = new RegisterRequest();
        registerReq.setFirstName("Test");
        registerReq.setLastName("User");
        registerReq.setEmail("test@example.com");
        registerReq.setPassword("password123");
        registerReq.setPhoneNumber("+919876543210");

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(registerReq)))
                .build();
        
        HttpResponse<String> response = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, response.statusCode());

        Optional<User> user = userRepository.findByPhoneNumber("+919876543210");
        assertTrue(user.isPresent());
        assertFalse(user.get().isPhoneVerified());
        
        return "+919876543210";
    }

    private String captureConsoleOtpHash(String phone) {
        // Since we can't easily intercept System.out, we will grab the OTP from DB 
        // to bypass having to guess it, and we will verify the OTP generation logic.
        Optional<OtpEntity> otp = otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(phone);
        assertTrue(otp.isPresent());
        return otp.get().getOtpHash();
    }

    // Helper to find the actual code by brute force since it's 4 digits and we know the hash
    private String bruteForceOtp(String hash) {
        for (int i = 1000; i <= 9999; i++) {
            if (passwordEncoder.matches(String.valueOf(i), hash)) {
                return String.valueOf(i);
            }
        }
        return null;
    }

    @Test
    public void testOtpRequestAndLength() throws Exception {
        String phone = "+919876543210";
        OtpRequest req = new OtpRequest();
        req.setPhoneNumber(phone);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/request-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());

        Optional<OtpEntity> otpOpt = otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(phone);
        assertTrue(otpOpt.isPresent());
        
        String code = bruteForceOtp(otpOpt.get().getOtpHash());
        assertNotNull(code);
        assertEquals(4, code.length());
    }

    @Test
    public void testSuccessfulOtpVerificationAndPhoneVerifiedSet() throws Exception {
        String phone = createTestUserAndGetPhone();

        // 1. Request OTP
        OtpRequest req = new OtpRequest();
        req.setPhoneNumber(phone);
        HttpRequest requestOtp = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/request-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
        httpClient.send(requestOtp, HttpResponse.BodyHandlers.ofString());

        // 2. Get code
        String hash = captureConsoleOtpHash(phone);
        String code = bruteForceOtp(hash);

        // 3. Verify OTP
        OtpVerifyRequest vReq = new OtpVerifyRequest();
        vReq.setPhoneNumber(phone);
        vReq.setOtp(code);
        
        HttpRequest verifyRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(vReq)))
                .build();

        HttpResponse<String> verifyResponse = httpClient.send(verifyRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, verifyResponse.statusCode());

        // 4. Check user is verified
        User user = userRepository.findByPhoneNumber(phone).get();
        assertTrue(user.isPhoneVerified());

        // 5. Check reused OTP fails
        HttpResponse<String> reusedResponse = httpClient.send(verifyRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, reusedResponse.statusCode());
    }

    @Test
    public void testInvalidOtpFails() throws Exception {
        String phone = "+919876543210";
        OtpRequest req = new OtpRequest();
        req.setPhoneNumber(phone);
        HttpRequest requestOtp = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/request-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
        httpClient.send(requestOtp, HttpResponse.BodyHandlers.ofString());

        OtpVerifyRequest vReq = new OtpVerifyRequest();
        vReq.setPhoneNumber(phone);
        vReq.setOtp("0000"); // Unlikely to be the generated OTP
        
        HttpRequest verifyRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(vReq)))
                .build();

        HttpResponse<String> verifyResponse = httpClient.send(verifyRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, verifyResponse.statusCode());
    }

    @Test
    public void testExpiredOtpFails() throws Exception {
        String phone = "+919876543210";
        
        // Manual insert expired OTP
        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setPhoneNumber(phone);
        otpEntity.setOtpHash(passwordEncoder.encode("1234"));
        otpEntity.setExpiresAt(Instant.now().minus(1, ChronoUnit.MINUTES)); // expired
        otpRepository.save(otpEntity);

        OtpVerifyRequest vReq = new OtpVerifyRequest();
        vReq.setPhoneNumber(phone);
        vReq.setOtp("1234");
        
        HttpRequest verifyRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(vReq)))
                .build();

        HttpResponse<String> verifyResponse = httpClient.send(verifyRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, verifyResponse.statusCode());
    }

    @Test
    public void testResendInvalidatesPrevious() throws Exception {
        String phone = "+919876543210";
        
        // Request 1
        OtpRequest req = new OtpRequest();
        req.setPhoneNumber(phone);
        HttpRequest requestOtp1 = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/request-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
        httpClient.send(requestOtp1, HttpResponse.BodyHandlers.ofString());

        String hash1 = captureConsoleOtpHash(phone);
        String code1 = bruteForceOtp(hash1);

        // Resend (Request 2)
        HttpRequest requestOtp2 = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/resend-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
        httpClient.send(requestOtp2, HttpResponse.BodyHandlers.ofString());

        // Verify with code1 should fail because it's not the latest OTP
        OtpVerifyRequest vReq = new OtpVerifyRequest();
        vReq.setPhoneNumber(phone);
        vReq.setOtp(code1);
        
        HttpRequest verifyRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(vReq)))
                .build();

        HttpResponse<String> verifyResponse = httpClient.send(verifyRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, verifyResponse.statusCode());
    }
}
