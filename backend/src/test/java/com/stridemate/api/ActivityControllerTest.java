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

    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private HttpClient httpClient;
    private String jwtToken;
    private User testUser;

    @BeforeEach
    public void setup() throws Exception {
        objectMapper.findAndRegisterModules();
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
        assertEquals(401, response.statusCode());
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

    // ==========================================
    // PHASE 3 — LIVE TRACKER AUTOMATED TESTS
    // ==========================================

    @Test
    public void testCreateAutoTrackSegmentedActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setDistanceKm(new BigDecimal("2.50"));
        request.setTotalDurationSeconds(900); // 15 mins
        request.setWalkingDurationSeconds(300); // 5 mins
        request.setJoggingDurationSeconds(300); // 5 mins
        request.setRunningDurationSeconds(300); // 5 mins
        request.setStartedAt(java.time.Instant.now().minusSeconds(900));
        request.setEndedAt(java.time.Instant.now());

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertNotNull(body.get("activityId"));
        assertNotNull(body.get("points"));
        
        // Server-calculated points must be > 0 and deterministic
        int points = ((Number) body.get("points")).intValue();
        assertEquals(225, points); // weighted segment calculation: 22 (walk) + 81 (jog) + 122 (run) = 225 pts

        // Calories must be calculated server-side
        assertNotNull(body.get("calories"));
        int calories = ((Number) body.get("calories")).intValue();
        assertEquals(125, calories); // (5m*4.5 + 5m*8.5 + 5m*12.0) = 22.5 + 42.5 + 60 = 125 kcal

        // Check ownership
        assertEquals(testUser.getId().toString(), body.get("userId"));
    }

    @Test
    public void testAutoTrackImpossibleSpeedRejection() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setDistanceKm(new BigDecimal("25.0")); // 25km in 300 seconds = 300 km/h (impossible)
        request.setTotalDurationSeconds(300);
        request.setRunningDurationSeconds(300);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        String message = (String) body.get("message");
        assertNotNull(message);
        assertEquals(true, message.contains("Impossible speed/distance telemetry detected"));
    }

    @Test
    public void testAutoTrackSegmentDurationsSumExceedsTotal() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setDistanceKm(new BigDecimal("1.0"));
        request.setTotalDurationSeconds(300); // 5 mins total
        request.setWalkingDurationSeconds(300); // 5 mins
        request.setRunningDurationSeconds(300); // 5 mins (sum = 10 mins > 5 mins + 60s tolerance)

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(400, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        String message = (String) body.get("message");
        assertNotNull(message);
        assertEquals(true, message.contains("exceeds total duration"));
    }

    @Test
    public void testManualGymTimerActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.GYM);
        request.setDurationMinutes(30);
        request.setDurationSeconds(0);
        request.setTotalDurationSeconds(1800);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(150, body.get("points")); // 30 mins * 5 pts/min = 150 pts
        assertEquals(180, body.get("calories")); // 30 mins * 6 kcal/min = 180 kcal
    }

    @Test
    public void testManualSwimTimerActivity() throws Exception {
        ActivityRequest request = new ActivityRequest();
        request.setSport(SportType.SWIMMING);
        request.setDurationMinutes(20);
        request.setDurationSeconds(0);
        request.setTotalDurationSeconds(1200);

        HttpResponse<String> response = postActivity(request, jwtToken);
        assertEquals(201, response.statusCode());

        Map<String, Object> body = objectMapper.readValue(response.body(), Map.class);
        assertEquals(300, body.get("points")); // 20 mins * 15 pts/min = 300 pts
        assertEquals(200, body.get("calories")); // 20 mins * 10 kcal/min = 200 kcal
    }

    @Test
    public void testAutoTrackDominantSportInference() throws Exception {
        // 1. Walking dominant
        ActivityRequest walkReq = new ActivityRequest();
        walkReq.setDistanceKm(new BigDecimal("1.2"));
        walkReq.setTotalDurationSeconds(600);
        walkReq.setWalkingDurationSeconds(500);
        walkReq.setRunningDurationSeconds(100);
        HttpResponse<String> walkRes = postActivity(walkReq, jwtToken);
        assertEquals(201, walkRes.statusCode());
        Map<String, Object> walkBody = objectMapper.readValue(walkRes.body(), Map.class);
        assertEquals("WALKING", walkBody.get("sport"));

        // 2. Running dominant
        ActivityRequest runReq = new ActivityRequest();
        runReq.setDistanceKm(new BigDecimal("2.0"));
        runReq.setTotalDurationSeconds(600);
        runReq.setWalkingDurationSeconds(100);
        runReq.setJoggingDurationSeconds(200);
        runReq.setRunningDurationSeconds(300);
        HttpResponse<String> runRes = postActivity(runReq, jwtToken);
        assertEquals(201, runRes.statusCode());
        Map<String, Object> runBody = objectMapper.readValue(runRes.body(), Map.class);
        assertEquals("RUNNING", runBody.get("sport"));

        // 3. Cycling dominant
        ActivityRequest cycleReq = new ActivityRequest();
        cycleReq.setDistanceKm(new BigDecimal("5.0"));
        cycleReq.setTotalDurationSeconds(900);
        cycleReq.setWalkingDurationSeconds(60);
        cycleReq.setCyclingDurationSeconds(840);
        HttpResponse<String> cycleRes = postActivity(cycleReq, jwtToken);
        assertEquals(201, cycleRes.statusCode());
        Map<String, Object> cycleBody = objectMapper.readValue(cycleRes.body(), Map.class);
        assertEquals("CYCLING", cycleBody.get("sport"));
    }
}
