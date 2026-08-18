package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.environment.dto.AirQualityDto;
import com.stridemate.api.environment.dto.EnvironmentResponseDto;
import com.stridemate.api.environment.dto.WeatherDto;
import com.stridemate.api.environment.service.EnvironmentScoringEngine;
import com.stridemate.api.safety.dto.EmergencyEventDto;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.safety.entity.EmergencyEvent;
import com.stridemate.api.safety.repository.EmergencyEventRepository;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.entity.Role;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.EmergencyContactRepository;
import com.stridemate.api.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class EnvironmentAndSafetyTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private EmergencyEventRepository emergencyEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private EnvironmentScoringEngine scoringEngine;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User user1;
    private User user2;
    private String jwtToken1;
    private String jwtToken2;

    @BeforeEach
    void setUp() throws Exception {
        emergencyEventRepository.deleteAll();
        emergencyContactRepository.deleteAll();
        userRepository.deleteAll();

        user1 = new User();
        user1.setFirstName("Sarah");
        user1.setLastName("Connor");
        user1.setEmail("sarah." + UUID.randomUUID() + "@example.com");
        user1.setPasswordHash(passwordEncoder.encode("Secret123!"));
        user1.setRole(Role.USER);
        userRepository.save(user1);

        UserDetails ud1 = userDetailsService.loadUserByUsername(user1.getEmail());
        jwtToken1 = jwtUtil.generateToken(ud1);

        user2 = new User();
        user2.setFirstName("John");
        user2.setLastName("Doe");
        user2.setEmail("john." + UUID.randomUUID() + "@example.com");
        user2.setPasswordHash(passwordEncoder.encode("Secret123!"));
        user2.setRole(Role.USER);
        userRepository.save(user2);

        UserDetails ud2 = userDetailsService.loadUserByUsername(user2.getEmail());
        jwtToken2 = jwtUtil.generateToken(ud2);
    }

    // =========================================================================
    // PHASE 6: ENVIRONMENT INTELLIGENCE TESTS
    // =========================================================================

    @Test
    void testEnvironment_ValidCoordinates_Returns200WithEvaluatedScores() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/environment/current?lat=37.7749&lon=-122.4194"))
                .header("Authorization", "Bearer " + jwtToken1)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        EnvironmentResponseDto dto = objectMapper.readValue(res.body(), EnvironmentResponseDto.class);
        assertNotNull(dto.getWeather());
        assertNotNull(dto.getAirQuality());
        assertNotNull(dto.getCondition());
        assertTrue(dto.getRunningScore() >= 0 && dto.getRunningScore() <= 100);
        assertNotNull(dto.getRecommendation());
        assertNotNull(dto.getNearbySpots());
    }

    @Test
    void testEnvironment_InvalidCoordinates_Returns400() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/environment/current?lat=999.0&lon=0.0"))
                .header("Authorization", "Bearer " + jwtToken1)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, res.statusCode());
    }

    @Test
    void testEnvironment_Unauthenticated_Returns401() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/environment/current?lat=37.7749&lon=-122.4194"))
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, res.statusCode());
    }

    @Test
    void testEnvironmentScoringEngine_SeverePollution_OverridesGoodWeather() {
        // Ideal running weather (20C, no rain, light wind)
        WeatherDto perfectWeather = new WeatherDto(20.0, 20.0, 50.0, 8.0, 0.0, 0);
        // Hazardous AQI / PM2.5
        AirQualityDto hazardousAir = new AirQualityDto(250.0, 160.0, 300.0, 10.0, 80.0, 60.0, 20.0, 500.0);

        EnvironmentScoringEngine.EvaluationResult result = scoringEngine.evaluate(perfectWeather, hazardousAir, 2.0);

        assertEquals("AVOID", result.getCondition());
        assertTrue(result.getScore() <= 20);
        assertTrue(result.getRecommendation().contains("Hazardous") || result.getRecommendation().contains("NOT RECOMMENDED"));
    }

    // =========================================================================
    // PHASE 7: SAFETY / SOS TESTS
    // =========================================================================

    @Test
    void testTriggerSos_WithoutEmergencyContact_Returns400() throws Exception {
        SosRequestDto sosReq = new SosRequestDto(37.7749, -122.4194, 5.0, null);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/sos"))
                .header("Authorization", "Bearer " + jwtToken1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(sosReq)))
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, res.statusCode());
        assertTrue(res.body().contains("No emergency contact configured"));
    }

    @Test
    void testTriggerSos_WithPrimaryContact_CreatesEventAndDispatchesNotifications() throws Exception {
        // 1. Add emergency contact for User 1
        EmergencyContactRequest contactReq = new EmergencyContactRequest("Kyle Reese", "Friend", "+15551234567", true);
        HttpRequest addContactReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts"))
                .header("Authorization", "Bearer " + jwtToken1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(contactReq)))
                .build();
        HttpResponse<String> contactRes = httpClient.send(addContactReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, contactRes.statusCode());

        // 2. Trigger SOS
        SosRequestDto sosReq = new SosRequestDto(37.7749, -122.4194, 6.0, null);
        HttpRequest sosHttpReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/sos"))
                .header("Authorization", "Bearer " + jwtToken1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(sosReq)))
                .build();

        HttpResponse<String> sosRes = httpClient.send(sosHttpReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, sosRes.statusCode());

        SosResponseDto dto = objectMapper.readValue(sosRes.body(), SosResponseDto.class);
        assertNotNull(dto.getEventId());
        assertTrue("SENT".equals(dto.getStatus()) || "MOCK_SENT".equals(dto.getStatus()) || "PARTIALLY_SENT".equals(dto.getStatus()));
        assertTrue(dto.getLocationUrl().contains("37.774900,-122.419400"));
        assertEquals("Kyle Reese", dto.getContactName());
        assertEquals("+15551234567", dto.getContactPhone());

        // 3. Verify event is persisted in DB
        List<EmergencyEvent> events = emergencyEventRepository.findByUserIdOrderByTriggeredAtDesc(user1.getId());
        assertEquals(1, events.size());
        assertEquals(dto.getEventId(), events.get(0).getId());
    }

    @Test
    void testSafetyEvents_UserOwnershipIsolation() throws Exception {
        // Create an event for user 1 directly
        EmergencyEvent ev1 = new EmergencyEvent(user1, 37.7749, -122.4194, 5.0, null, "SOS alert");
        emergencyEventRepository.save(ev1);

        // Fetch events as user 2 -> must return empty list (isolated)
        HttpRequest getReq2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/events"))
                .header("Authorization", "Bearer " + jwtToken2)
                .GET()
                .build();

        HttpResponse<String> res2 = httpClient.send(getReq2, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res2.statusCode());
        List<?> events2 = objectMapper.readValue(res2.body(), List.class);
        assertEquals(0, events2.size());

        // Fetch events as user 1 -> must return 1 event
        HttpRequest getReq1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/events"))
                .header("Authorization", "Bearer " + jwtToken1)
                .GET()
                .build();

        HttpResponse<String> res1 = httpClient.send(getReq1, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res1.statusCode());
        List<?> events1 = objectMapper.readValue(res1.body(), List.class);
        assertEquals(1, events1.size());
    }

    @Test
    void testResolveSafetyEvent_OwnerCanResolve_OtherUserForbidden() throws Exception {
        EmergencyEvent ev = new EmergencyEvent(user1, 37.7749, -122.4194, 5.0, null, "SOS alert");
        ev = emergencyEventRepository.save(ev);

        // User 2 attempts to resolve User 1's event -> 403 Forbidden
        HttpRequest resolveReq2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/events/" + ev.getId() + "/resolve"))
                .header("Authorization", "Bearer " + jwtToken2)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> res2 = httpClient.send(resolveReq2, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, res2.statusCode());

        // User 1 resolves their own event -> 200 OK
        HttpRequest resolveReq1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/events/" + ev.getId() + "/resolve"))
                .header("Authorization", "Bearer " + jwtToken1)
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> res1 = httpClient.send(resolveReq1, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res1.statusCode());

        EmergencyEventDto resolvedDto = objectMapper.readValue(res1.body(), EmergencyEventDto.class);
        assertEquals("RESOLVED", resolvedDto.getStatus());
        assertNotNull(resolvedDto.getResolvedAt());
    }
}
