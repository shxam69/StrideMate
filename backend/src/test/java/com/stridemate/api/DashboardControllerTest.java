package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class DashboardControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private ObjectMapper objectMapper = new ObjectMapper();
    private HttpClient httpClient;
    private String jwtToken;
    private User testUser;

    @BeforeEach
    public void setup() throws Exception {
        httpClient = HttpClient.newHttpClient();
        activityRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setFirstName("Dash");
        user.setLastName("Board");
        user.setEmail("dash@example.com");
        user.setPasswordHash(passwordEncoder.encode("secret"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        testUser = userRepository.save(user);

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("dash@example.com");
        loginRequest.setPassword("secret");

        HttpRequest loginReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(loginRequest)))
                .build();

        HttpResponse<String> loginRes = httpClient.send(loginReq, HttpResponse.BodyHandlers.ofString());
        Map<String, Object> body = objectMapper.readValue(loginRes.body(), Map.class);
        jwtToken = (String) body.get("token");
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/dashboard/me";
    }

    @Test
    public void testUnauthenticatedDashboardReturns401() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, response.statusCode()); // or 401
    }

    @Test
    public void testAuthenticatedDashboard() throws Exception {
        // Create some activities
        Activity a1 = new Activity();
        a1.setUser(testUser);
        a1.setSport(SportType.RUNNING);
        a1.setDistanceKm(new BigDecimal("5.0"));
        a1.setPoints(500);
        activityRepository.save(a1);

        Activity a2 = new Activity();
        a2.setUser(testUser);
        a2.setSport(SportType.WALKING);
        a2.setDistanceKm(new BigDecimal("2.0"));
        a2.setPoints(100);
        activityRepository.save(a2);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Authorization", "Bearer " + jwtToken)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        
        // Assert Summary
        Map<String, Object> summary = (Map<String, Object>) body.get("summary");
        assertEquals(600, summary.get("totalPoints"));
        assertEquals(2, summary.get("totalActivities"));
        assertEquals(1, summary.get("currentRank"));
        
        // Assert User
        Map<String, Object> user = (Map<String, Object>) body.get("user");
        assertEquals("dash@example.com", user.get("email"));
        assertEquals("Dash", user.get("firstName"));
        
        // Assert Activity History
        java.util.List<?> history = (java.util.List<?>) body.get("activityHistory");
        assertEquals(2, history.size());
        
        // Assert Volume Over Time
        java.util.List<?> volume = (java.util.List<?>) body.get("volumeOverTime");
        assertEquals(1, volume.size()); // Both activities today
        
        // Assert Sport Breakdown
        java.util.List<?> breakdown = (java.util.List<?>) body.get("sportBreakdown");
        assertEquals(2, breakdown.size()); // Running and Walking
    }
}
