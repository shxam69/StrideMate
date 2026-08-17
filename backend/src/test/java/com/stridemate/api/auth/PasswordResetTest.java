package com.stridemate.api.auth;

import com.stridemate.api.auth.entity.PasswordResetToken;
import com.stridemate.api.auth.repository.PasswordResetTokenRepository;
import com.stridemate.api.user.entity.Role;
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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PasswordResetTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    private User testUser;
    private final String RAW_PASSWORD = "oldPassword123";

    @BeforeEach
    void setUp() {
        tokenRepository.deleteAll();

        testUser = new User();
        testUser.setFirstName("John");
        testUser.setLastName("Doe");
        testUser.setEmail(java.util.UUID.randomUUID().toString() + "@example.com");
        testUser.setPhoneNumber("+1" + java.util.UUID.randomUUID().toString().substring(0, 10));
        testUser.setPasswordHash(passwordEncoder.encode(RAW_PASSWORD));
        testUser.setRole(Role.USER);
        userRepository.save(testUser);
    }

    private HttpResponse<String> sendPostRequest(String path, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void testForgotPasswordExistingEmail() throws Exception {
        // First request sends one email and creates one token
        HttpResponse<String> response = sendPostRequest("/api/auth/forgot-password", "{\"email\":\"" + testUser.getEmail() + "\"}");
        assertEquals(200, response.statusCode());
        assertEquals("If an account exists for this email, a password reset link has been sent.", response.body());
        assertEquals(1, tokenRepository.count());

        // Second request returns 200 and creates a second token (rate limit removed)
        HttpResponse<String> response2 = sendPostRequest("/api/auth/forgot-password", "{\"email\":\"" + testUser.getEmail() + "\"}");
        assertEquals(200, response2.statusCode());
        assertEquals("If an account exists for this email, a password reset link has been sent.", response2.body());
        assertEquals(2, tokenRepository.count()); // Count is now 2
    }

    @Test
    void testForgotPasswordUnknownEmail() throws Exception {
        HttpResponse<String> response = sendPostRequest("/api/auth/forgot-password", "{\"email\":\"unknown@example.com\"}");
        assertEquals(200, response.statusCode());
        assertEquals("If an account exists for this email, a password reset link has been sent.", response.body());

        assertEquals(0, tokenRepository.count());
    }

    @Test
    void testResetPasswordValidToken() throws Exception {
        // Prepare token in DB directly
        String rawToken = "my-secret-test-token";
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(testUser);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        tokenRepository.save(token);

        // Reset password via API
        HttpResponse<String> response = sendPostRequest("/api/auth/reset-password", "{\"token\":\"" + rawToken + "\",\"newPassword\":\"newPassword456\"}");
        assertEquals(200, response.statusCode());
        assertEquals("Password successfully reset.", response.body());

        // Verify password changed
        User updatedUser = userRepository.findById(testUser.getId()).get();
        assertTrue(passwordEncoder.matches("newPassword456", updatedUser.getPasswordHash()));
        assertFalse(passwordEncoder.matches(RAW_PASSWORD, updatedUser.getPasswordHash()));

        // Verify token used
        PasswordResetToken storedToken = tokenRepository.findAll().get(0);
        assertNotNull(storedToken.getUsedAt());

        // Verify token cannot be reused
        HttpResponse<String> reuseResponse = sendPostRequest("/api/auth/reset-password", "{\"token\":\"" + rawToken + "\",\"newPassword\":\"evenNewerPass\"}");
        assertEquals(400, reuseResponse.statusCode());
        assertEquals("Invalid or expired reset token", reuseResponse.body());
    }

    @Test
    void testResetPasswordInvalidToken() throws Exception {
        HttpResponse<String> response = sendPostRequest("/api/auth/reset-password", "{\"token\":\"invalid-token-123\",\"newPassword\":\"newPassword456\"}");
        assertEquals(400, response.statusCode());
        assertEquals("Invalid or expired reset token", response.body());
    }

    @Test
    void testResetPasswordExpiredToken() throws Exception {
        String rawToken = "my-secret-test-token-expired";
        PasswordResetToken token = new PasswordResetToken();
        token.setUser(testUser);
        token.setTokenHash(hashToken(rawToken));
        token.setExpiresAt(Instant.now().minus(5, ChronoUnit.MINUTES));
        tokenRepository.save(token);

        HttpResponse<String> response = sendPostRequest("/api/auth/reset-password", "{\"token\":\"" + rawToken + "\",\"newPassword\":\"newPassword456\"}");
        assertEquals(400, response.statusCode());
        assertEquals("Invalid or expired reset token", response.body());
    }
}
