package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.entity.SportType;
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
public class ActivityControllerTest {

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
    private String jwtToken;
    private User testUser;

    @BeforeEach
    public void setup() throws Exception {
        httpClient = HttpClient.newHttpClient();
        
        activityRepository.deleteAll();
        
        // Ensure test user exists
        if (userRepository.findByEmail("runner@example.com").isEmpty()) {
            User user = new User();
            user.setFirstName("Runner");
            user.setLastName("Man");
            user.setEmail("runner@example.com");
            user.setPasswordHash(passwordEncoder.encode("secret123"));
            user.setRole(com.stridemate.api.user.entity.Role.USER);
            testUser = userRepository.save(user);
        } else {
            testUser = userRepository.findByEmail("runner@example.com").get();
        }

        // Login to get token
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("runner@example.com");
        loginRequest.setPassword("secret123");

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
        return "http://localhost:" + port + "/api/activities";
    }

    private HttpResponse<String> postActivity(ActivityRequest request, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(request)));
        
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        
        return httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    @Test
    public void testCreateWalkingActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.WALKING);
        request.setDistanceKm(new BigDecimal("1.55"));

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertNotNull(body.get("activityId"));
        assertEquals(77, body.get("points"));
    }

    @Test
    public void testCreateRunningActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.RUNNING);
        request.setDistanceKm(new BigDecimal("2.5"));

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(250, body.get("points"));
    }

    @Test
    public void testCreateCyclingActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.CYCLING);
        request.setDistanceKm(new BigDecimal("1.9"));

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(47, body.get("points"));
    }

    @Test
    public void testCreateSwimmingActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.SWIMMING);
        request.setDurationMinutes(2);
        request.setDurationSeconds(59);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(30, body.get("points"));
    }

    @Test
    public void testCreateGymActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.GYM);
        request.setDurationMinutes(1);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
    }

    @Test
    public void testCreateDailyStepsActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.DAILY_STEPS);
        request.setSteps(399);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());
        
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(3, body.get("points"));
    }

    @Test
    public void testUnauthenticatedRequest() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.WALKING);
        request.setDistanceKm(new BigDecimal("1.0"));

        HttpResponse<String> response = postActivity(request, null);
        assertEquals(403, response.statusCode()); // or 401
    }

    @Test
    public void testInvalidSportCombination() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.RUNNING);
        request.setDurationMinutes(30); // Running shouldn't have duration

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals("Distance is required and must be greater than zero for RUNNING", body.get("message")); // Because distance is null
        
        // Test with distance and duration
        request.setDistanceKm(new BigDecimal("1.0"));
        response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());
        body = objectMapper.readValue(response.body(), Map.class);
        assertEquals("Duration and steps are not applicable for RUNNING", body.get("message"));
    }

    @Test
    public void testMissingRequiredMetric() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.SWIMMING);
        // Missing duration

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals("Duration minutes is required for SWIMMING", body.get("message"));
    }

    @Test
    public void testNegativeMetric() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.WALKING);
        request.setDistanceKm(new BigDecimal("-1.0"));

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());
        
        // It could fail at @PositiveOrZero validation or in service
        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertNotNull(body.get("message"));
    }
}
