package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.auth.dto.RegisterRequest;
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
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class AuthControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.stridemate.api.activity.repository.ActivityRepository activityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper = new ObjectMapper();

    private HttpClient httpClient;

    @Autowired
    private com.stridemate.api.auth.repository.PasswordResetTokenRepository tokenRepository;

    @Autowired
    private com.stridemate.api.auth.repository.OtpRepository otpRepository;

    @BeforeEach
    public void setup() {
        tokenRepository.deleteAll();
        otpRepository.deleteAll();
        activityRepository.deleteAll();
        userRepository.deleteAll();
        httpClient = HttpClient.newHttpClient();
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/auth";
    }

    @Test
    public void testSuccessfulRegistrationDoesNotReturnToken() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("john.doe@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("+919876543210");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, response.statusCode());
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        // Authentication token MUST NOT be issued before OTP verification
        assertNull(body.get("token"));
        assertEquals("john.doe@example.com", body.get("email"));
    }

    @Test
    public void testVerifyOtp_Success() throws Exception {
        User user = new User();
        user.setFirstName("Verified");
        user.setLastName("User");
        user.setEmail("verified.user@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        // Manually save valid OTP entity
        com.stridemate.api.auth.entity.OtpEntity otpEntity = new com.stridemate.api.auth.entity.OtpEntity();
        otpEntity.setEmail("verified.user@example.com");
        otpEntity.setOtpHash(passwordEncoder.encode("123456"));
        otpEntity.setExpiresAt(java.time.Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        otpEntity.setAttempts(0);
        otpRepository.save(otpEntity);

        Map<String, String> verifyReq = Map.of("email", "verified.user@example.com", "otp", "123456");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(verifyReq)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertNotNull(body.get("token"), "JWT token must be created only after OTP verification");
        Map<String, Object> userMap = (Map<String, Object>) body.get("user");
        assertEquals("verified.user@example.com", userMap.get("email"));
    }

    @Test
    public void testVerifyOtp_InvalidOtp_Fails() throws Exception {
        User user = new User();
        user.setFirstName("Invalid");
        user.setLastName("OtpUser");
        user.setEmail("invalid.otp@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        com.stridemate.api.auth.entity.OtpEntity otpEntity = new com.stridemate.api.auth.entity.OtpEntity();
        otpEntity.setEmail("invalid.otp@example.com");
        otpEntity.setOtpHash(passwordEncoder.encode("123456"));
        otpEntity.setExpiresAt(java.time.Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        otpEntity.setAttempts(0);
        otpRepository.save(otpEntity);

        Map<String, String> verifyReq = Map.of("email", "invalid.otp@example.com", "otp", "999999");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(verifyReq)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, response.statusCode());
    }

    @Test
    public void testVerifyOtp_ExpiredOtp_Fails() throws Exception {
        User user = new User();
        user.setFirstName("Expired");
        user.setLastName("OtpUser");
        user.setEmail("expired.otp@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        com.stridemate.api.auth.entity.OtpEntity otpEntity = new com.stridemate.api.auth.entity.OtpEntity();
        otpEntity.setEmail("expired.otp@example.com");
        otpEntity.setOtpHash(passwordEncoder.encode("123456"));
        // Expired in past
        otpEntity.setExpiresAt(java.time.Instant.now().minus(5, java.time.temporal.ChronoUnit.MINUTES));
        otpEntity.setAttempts(0);
        otpRepository.save(otpEntity);

        Map<String, String> verifyReq = Map.of("email", "expired.otp@example.com", "otp", "123456");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(verifyReq)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, response.statusCode());
    }

    @Test
    public void testVerifyOtp_ReusedOtp_Fails() throws Exception {
        User user = new User();
        user.setFirstName("Reused");
        user.setLastName("OtpUser");
        user.setEmail("reused.otp@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        com.stridemate.api.auth.entity.OtpEntity otpEntity = new com.stridemate.api.auth.entity.OtpEntity();
        otpEntity.setEmail("reused.otp@example.com");
        otpEntity.setOtpHash(passwordEncoder.encode("123456"));
        otpEntity.setExpiresAt(java.time.Instant.now().plus(5, java.time.temporal.ChronoUnit.MINUTES));
        otpEntity.setAttempts(0);
        otpRepository.save(otpEntity);

        Map<String, String> verifyReq = Map.of("email", "reused.otp@example.com", "otp", "123456");
        HttpRequest request1 = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(verifyReq)))
                .build();

        HttpResponse<String> response1 = httpClient.send(request1, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response1.statusCode());

        // Second verification with same OTP must fail
        HttpRequest request2 = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/verify-otp"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(verifyReq)))
                .build();

        HttpResponse<String> response2 = httpClient.send(request2, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, response2.statusCode());
    }

    @Test
    public void testDuplicateFirstAndLastName() throws Exception {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john.doe@example.com");
        user.setPasswordHash("hash");
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        RegisterRequest request = new RegisterRequest();
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setEmail("another.email@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("+919876543210");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(409, response.statusCode());
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals("User with this first and last name already exists", body.get("message"));
    }

    @Test
    public void testCaseInsensitiveDuplicateFirstAndLastName() throws Exception {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setEmail("john.doe@example.com");
        user.setPasswordHash("hash");
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        RegisterRequest request = new RegisterRequest();
        request.setFirstName("john"); // lowercase
        request.setLastName("DOE");   // uppercase
        request.setEmail("another.email@example.com");
        request.setPassword("password123");
        request.setPhoneNumber("+919876543210");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(409, response.statusCode());
    }

    @Test
    public void testDuplicateEmail() throws Exception {
        User user = new User();
        user.setFirstName("Jane");
        user.setLastName("Smith");
        user.setEmail("jane.smith@example.com");
        user.setPasswordHash("hash");
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        RegisterRequest request = new RegisterRequest();
        request.setFirstName("Different");
        request.setLastName("Name");
        request.setEmail("jane.smith@example.com"); // duplicate email
        request.setPassword("password123");
        request.setPhoneNumber("+919876543210");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(409, response.statusCode());
    }

    @Test
    public void testSuccessfulLogin() throws Exception {
        User user = new User();
        user.setFirstName("Alice");
        user.setLastName("Wonderland");
        user.setEmail("alice@example.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("alice@example.com");
        request.setPassword("secret123");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertNotNull(body.get("token"));
    }

    @Test
    public void testInvalidLogin() throws Exception {
        User user = new User();
        user.setFirstName("Bob");
        user.setLastName("Builder");
        user.setEmail("bob@example.com");
        user.setPasswordHash(passwordEncoder.encode("secret123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("bob@example.com");
        request.setPassword("wrongpassword");

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)))
                .build();

        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, response.statusCode());
    }

    @Test
    public void testAuthenticatedMe() throws Exception {
        User user = new User();
        user.setFirstName("Charlie");
        user.setLastName("Chaplin");
        user.setEmail("charlie@example.com");
        user.setPasswordHash(passwordEncoder.encode("password123"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("charlie@example.com");
        loginRequest.setPassword("password123");

        HttpRequest loginReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(loginRequest)))
                .build();

        HttpResponse<String> loginRes = httpClient.send(loginReq, HttpResponse.BodyHandlers.ofString());
        String token = (String) objectMapper.readValue(loginRes.body(), Map.class).get("token");

        HttpRequest meReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/me"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();

        HttpResponse<String> meRes = httpClient.send(meReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, meRes.statusCode());
        Map<String, Object> body = objectMapper.readValue(meRes.body(), Map.class);
        assertEquals("charlie@example.com", body.get("email"));
        assertNull(body.get("passwordHash"));
    }

    @Test
    public void testUnauthenticatedMe() throws Exception {
        HttpRequest meReq = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl() + "/me"))
                .GET()
                .build();

        HttpResponse<String> meRes = httpClient.send(meReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, meRes.statusCode());
    }
}
