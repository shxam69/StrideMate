package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.environment.dto.SmartMapResponseDto;
import com.stridemate.api.environment.dto.SmartRunningSpotDto;
import com.stridemate.api.user.entity.Role;
import com.stridemate.api.user.entity.User;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SmartMapTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private String jwtToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User user = new User();
        user.setFirstName("Runner");
        user.setLastName("Test");
        user.setEmail("runner." + UUID.randomUUID() + "@example.com");
        user.setPasswordHash(passwordEncoder.encode("Secret123!"));
        user.setRole(Role.USER);
        userRepository.save(user);

        UserDetails ud = userDetailsService.loadUserByUsername(user.getEmail());
        jwtToken = jwtUtil.generateToken(ud);
    }

    @Test
    void testSmartMap_Authenticated_Returns200WithEvaluatedSpotsAndBestPlace() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/map/running-spots?lat=37.7749&lon=-122.4194"))
                .header("Authorization", "Bearer " + jwtToken)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        SmartMapResponseDto dto = objectMapper.readValue(res.body(), SmartMapResponseDto.class);
        assertNotNull(dto.getUserLocation());
        assertNotNull(dto.getOverallCondition());
        assertTrue(dto.getOverallRunningScore() >= 0 && dto.getOverallRunningScore() <= 100);
        assertNotNull(dto.getNearbySpots());
        assertFalse(dto.getNearbySpots().isEmpty(), "Nearby running spots list should not be empty");

        SmartRunningSpotDto firstSpot = dto.getNearbySpots().get(0);
        assertNotNull(firstSpot.getName());
        assertNotNull(firstSpot.getSuitabilityTier());
        assertTrue(firstSpot.getSuitabilityScore() > 0);
        assertNotNull(firstSpot.getMapsUrl());
        assertNotNull(firstSpot.getRouteUrl());
        assertNotNull(firstSpot.getTrafficInfo());
        assertNotNull(firstSpot.getHighlights());
    }

    @Test
    void testSmartMap_Unauthenticated_Returns401() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/map/running-spots?lat=37.7749&lon=-122.4194"))
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(401, res.statusCode());
    }

    @Test
    void testSmartMap_SpotsAreRankedDescendingBySuitabilityScore() throws Exception {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/map/running-spots?lat=37.7749&lon=-122.4194"))
                .header("Authorization", "Bearer " + jwtToken)
                .GET()
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode());

        SmartMapResponseDto dto = objectMapper.readValue(res.body(), SmartMapResponseDto.class);
        for (int i = 0; i < dto.getNearbySpots().size() - 1; i++) {
            double curr = dto.getNearbySpots().get(i).getSuitabilityScore();
            double next = dto.getNearbySpots().get(i + 1).getSuitabilityScore();
            assertTrue(curr >= next, "Spots must be sorted in descending order of suitability score");
        }
    }
}
