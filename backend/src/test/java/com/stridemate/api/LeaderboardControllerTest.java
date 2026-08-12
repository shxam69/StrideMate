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
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class LeaderboardControllerTest {

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

    @BeforeEach
    public void setup() {
        httpClient = HttpClient.newHttpClient();
        activityRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/leaderboard";
    }

    private User createUser(String email, String firstName) {
        User user = new User();
        user.setFirstName(firstName);
        user.setLastName("Last");
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("secret"));
        user.setRole(com.stridemate.api.user.entity.Role.USER);
        return userRepository.save(user);
    }

    private void createActivity(User user, int points) {
        Activity activity = new Activity();
        activity.setUser(user);
        activity.setSport(SportType.RUNNING);
        activity.setDistanceKm(BigDecimal.valueOf(10));
        activity.setPoints(points);
        activityRepository.save(activity);
    }

    @Test
    public void testEmptyLeaderboard() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        List<?> body = objectMapper.readValue(response.body(), List.class);
        assertEquals(0, body.size());
    }

    @Test
    public void testLeaderboardOrderingAndTotals() throws Exception {
        User user1 = createUser("user1@test.com", "Alice"); // Should have 200 pts
        createActivity(user1, 100);
        createActivity(user1, 100);

        User user2 = createUser("user2@test.com", "Bob"); // Should have 300 pts
        createActivity(user2, 300);

        User user3 = createUser("user3@test.com", "Charlie"); // Should have 50 pts
        createActivity(user3, 50);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(getBaseUrl()))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());
        
        List<Map<String, Object>> body = objectMapper.readValue(response.body(), List.class);
        assertEquals(3, body.size());
        
        // Bob should be 1st with 300 points
        assertEquals(1, body.get(0).get("rank"));
        assertEquals("Bob", body.get(0).get("firstName"));
        assertEquals(300, body.get(0).get("totalPoints"));

        // Alice should be 2nd with 200 points
        assertEquals(2, body.get(1).get("rank"));
        assertEquals("Alice", body.get(1).get("firstName"));
        assertEquals(200, body.get(1).get("totalPoints"));

        // Charlie should be 3rd with 50 points
        assertEquals(3, body.get(2).get("rank"));
        assertEquals("Charlie", body.get(2).get("firstName"));
        assertEquals(50, body.get(2).get("totalPoints"));
    }
}
