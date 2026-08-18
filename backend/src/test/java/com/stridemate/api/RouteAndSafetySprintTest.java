package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.dto.ActivityRouteResponseDto;
import com.stridemate.api.activity.dto.RoutePointDto;
import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.ActivityRoutePointRepository;
import com.stridemate.api.activity.service.ActivityService;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.gamification.dto.ActivitySaveResultDto;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.entity.Role;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.EmergencyContactRepository;
import com.stridemate.api.user.repository.UserRepository;
import com.stridemate.api.user.service.EmergencyContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class RouteAndSafetySprintTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivityRoutePointRepository routePointRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private EmergencyContactService emergencyContactService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User user1;
    private String jwtToken1;
    private User user2;
    private String jwtToken2;

    @BeforeEach
    void setUp() {
        routePointRepository.deleteAll();
        activityRepository.deleteAll();
        emergencyContactRepository.deleteAll();
        userRepository.deleteAll();

        user1 = new User();
        user1.setFirstName("Alice");
        user1.setLastName("Walker");
        user1.setEmail("alice." + UUID.randomUUID() + "@example.com");
        user1.setPasswordHash(passwordEncoder.encode("Secret123!"));
        user1.setRole(Role.USER);
        userRepository.save(user1);

        UserDetails ud1 = userDetailsService.loadUserByUsername(user1.getEmail());
        jwtToken1 = jwtUtil.generateToken(ud1);

        user2 = new User();
        user2.setFirstName("Bob");
        user2.setLastName("Runner");
        user2.setEmail("bob." + UUID.randomUUID() + "@example.com");
        user2.setPasswordHash(passwordEncoder.encode("Secret123!"));
        user2.setRole(Role.USER);
        userRepository.save(user2);

        UserDetails ud2 = userDetailsService.loadUserByUsername(user2.getEmail());
        jwtToken2 = jwtUtil.generateToken(ud2);
    }

    @Test
    void testSaveActivityWithRoutePoints_SavesAndRetrievesSuccessfully() throws Exception {
        ActivityRequest req = new ActivityRequest();
        req.setSport(SportType.RUNNING);
        req.setDistanceKm(new BigDecimal("3.50"));
        req.setDurationMinutes(20);
        req.setDurationSeconds(0);
        req.setTotalDurationSeconds(1200);
        req.setRunningDurationSeconds(1200);

        List<RoutePointDto> routePoints = new ArrayList<>();
        routePoints.add(new RoutePointDto(37.7749, -122.4194, 5.0, 3.2, Instant.now().minusSeconds(1200)));
        routePoints.add(new RoutePointDto(37.7755, -122.4185, 4.5, 3.4, Instant.now().minusSeconds(600)));
        routePoints.add(new RoutePointDto(37.7760, -122.4175, 4.0, 3.5, Instant.now()));
        req.setRoutePoints(routePoints);

        ActivitySaveResultDto saved = activityService.createActivity(req, user1.getEmail());
        assertNotNull(saved.getActivity().getActivityId());

        // Query Route via REST endpoint
        HttpRequest getRouteReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities/" + saved.getActivity().getActivityId() + "/route"))
                .header("Authorization", "Bearer " + jwtToken1)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(getRouteReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        ActivityRouteResponseDto routeDto = objectMapper.readValue(res.body(), ActivityRouteResponseDto.class);
        assertEquals(saved.getActivity().getActivityId(), routeDto.getActivityId());
        assertEquals(3, routeDto.getPoints().size());
        assertEquals(37.7749, routeDto.getPoints().get(0).getLatitude(), 0.0001);
    }

    @Test
    void testRouteRetrieval_OwnershipIsolation_Returns403ForOtherUser() throws Exception {
        ActivityRequest req = new ActivityRequest();
        req.setSport(SportType.WALKING);
        req.setDistanceKm(new BigDecimal("1.20"));
        req.setDurationMinutes(15);
        req.setDurationSeconds(0);
        req.setTotalDurationSeconds(900);

        List<RoutePointDto> routePoints = List.of(
                new RoutePointDto(37.7749, -122.4194, 5.0, 1.4, Instant.now())
        );
        req.setRoutePoints(routePoints);

        ActivitySaveResultDto saved = activityService.createActivity(req, user1.getEmail());

        // User 2 tries to read User 1's route
        HttpRequest getRouteReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities/" + saved.getActivity().getActivityId() + "/route"))
                .header("Authorization", "Bearer " + jwtToken2)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(getRouteReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, res.statusCode(), "Accessing another user's GPS route must return 403 Forbidden");
    }

    @Test
    void testRoutePrivacyTrimming_ObscuresStartAndEndPoints() {
        Activity activity = new Activity();
        activity.setUser(user1);
        activity.setSport(SportType.RUNNING);
        activity.setDistanceKm(new BigDecimal("5.00"));
        activity.setTotalDurationSeconds(1800);
        activity.setPoints(50);
        activity.setCalories(350);
        activity.setRecordedAt(Instant.now());
        Activity saved = activityRepository.save(activity);

        // Add 12 route points
        List<com.stridemate.api.activity.entity.ActivityRoutePoint> points = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            points.add(new com.stridemate.api.activity.entity.ActivityRoutePoint(
                    saved,
                    37.7700 + (i * 0.001),
                    -122.4100 + (i * 0.001),
                    5.0,
                    3.0,
                    Instant.now().plusSeconds(i * 10)
            ));
        }
        routePointRepository.saveAll(points);

        // 1. Full Exact Route
        ActivityRouteResponseDto exact = activityService.getActivityRoute(saved.getId(), user1.getEmail(), false);
        assertEquals(12, exact.getPoints().size());
        assertFalse(exact.isPrivacyTrimmed());

        // 2. Privacy-Trimmed Route
        ActivityRouteResponseDto trimmed = activityService.getActivityRoute(saved.getId(), user1.getEmail(), true);
        assertTrue(trimmed.isPrivacyTrimmed());
        assertTrue(trimmed.getPoints().size() < 12, "Privacy trimmed route must have trimmed outer points");
    }

    @Test
    void testActivityDeletion_CascadeDeletesRoutePoints() {
        Activity activity = new Activity();
        activity.setUser(user1);
        activity.setSport(SportType.CYCLING);
        activity.setDistanceKm(new BigDecimal("10.00"));
        activity.setTotalDurationSeconds(1800);
        activity.setPoints(80);
        activity.setCalories(400);
        activity.setRecordedAt(Instant.now());
        Activity saved = activityRepository.save(activity);

        routePointRepository.save(new com.stridemate.api.activity.entity.ActivityRoutePoint(
                saved, 37.77, -122.41, 5.0, 6.0, Instant.now()
        ));

        assertEquals(1, routePointRepository.findByActivityIdOrderByRecordedAtAsc(saved.getId()).size());

        activityRepository.delete(saved);
        assertEquals(0, routePointRepository.findByActivityIdOrderByRecordedAtAsc(saved.getId()).size());
    }

    @Test
    void testSosTrigger_WithEmergencyContact_DispatchesAndRecordsTruthfulStatus() throws Exception {
        // Add emergency contact for user 1
        emergencyContactService.createContact(user1.getEmail(), new EmergencyContactRequest(
                "Bob Walker", "Spouse", "+14155552671", true
        ));

        SosRequestDto sosReq = new SosRequestDto(37.7749, -122.4194, 6.0, null, "test-req-123");

        HttpRequest postSos = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/sos"))
                .header("Authorization", "Bearer " + jwtToken1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(sosReq)))
                .build();

        HttpResponse<String> res = httpClient.send(postSos, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        SosResponseDto dto = objectMapper.readValue(res.body(), SosResponseDto.class);
        assertNotNull(dto.getEventId());
        assertNotNull(dto.getLocationUrl());
        assertTrue(dto.getLocationUrl().contains("37.7749"));
        assertNotNull(dto.getSms());
        assertNotNull(dto.getWhatsapp());
        assertNotNull(dto.getCall());
    }

    @Test
    void testSosTrigger_WithoutEmergencyContact_FailsGracefully() throws Exception {
        SosRequestDto sosReq = new SosRequestDto(37.7749, -122.4194, 6.0, null, "test-req-no-contact");

        HttpRequest postSos = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/sos"))
                .header("Authorization", "Bearer " + jwtToken1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(sosReq)))
                .build();

        HttpResponse<String> res = httpClient.send(postSos, HttpResponse.BodyHandlers.ofString());
        assertEquals(400, res.statusCode());
    }
}
