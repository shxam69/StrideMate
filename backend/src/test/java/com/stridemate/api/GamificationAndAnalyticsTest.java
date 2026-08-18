package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.auth.dto.LoginRequest;
import com.stridemate.api.gamification.entity.DailyQuest;
import com.stridemate.api.gamification.entity.UserProgress;
import com.stridemate.api.gamification.repository.DailyQuestRepository;
import com.stridemate.api.gamification.repository.UserAchievementRepository;
import com.stridemate.api.gamification.repository.UserProgressRepository;
import com.stridemate.api.gamification.service.GamificationService;
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
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class GamificationAndAnalyticsTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private UserProgressRepository userProgressRepository;

    @Autowired
    private UserAchievementRepository userAchievementRepository;

    @Autowired
    private DailyQuestRepository dailyQuestRepository;

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private HttpClient httpClient;
    private String token1;
    private String token2;
    private User user1;
    private User user2;

    @BeforeEach
    public void setup() throws Exception {
        httpClient = HttpClient.newHttpClient();
        dailyQuestRepository.deleteAll();
        userAchievementRepository.deleteAll();
        userProgressRepository.deleteAll();
        activityRepository.deleteAll();

        // User 1
        if (userRepository.findByEmail("gamer1@example.com").isEmpty()) {
            User u1 = new User();
            u1.setFirstName("Player");
            u1.setLastName("One");
            u1.setEmail("gamer1@example.com");
            u1.setPasswordHash(passwordEncoder.encode("pass123"));
            u1.setRole(com.stridemate.api.user.entity.Role.USER);
            user1 = userRepository.save(u1);
        } else {
            user1 = userRepository.findByEmail("gamer1@example.com").get();
        }

        // User 2
        if (userRepository.findByEmail("gamer2@example.com").isEmpty()) {
            User u2 = new User();
            u2.setFirstName("Player");
            u2.setLastName("Two");
            u2.setEmail("gamer2@example.com");
            u2.setPasswordHash(passwordEncoder.encode("pass123"));
            u2.setRole(com.stridemate.api.user.entity.Role.USER);
            user2 = userRepository.save(u2);
        } else {
            user2 = userRepository.findByEmail("gamer2@example.com").get();
        }

        token1 = loginAndGetToken("gamer1@example.com", "pass123");
        token2 = loginAndGetToken("gamer2@example.com", "pass123");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(loginRequest)))
                .build();

        HttpResponse<String> res = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
        Map<String, Object> body = objectMapper.readValue(res.body(), Map.class);
        return (String) body.get("token");
    }

    @Test
    public void testActivityAwardsXpAndChecksLevelUp() throws Exception {
        // 1. Initial Progression
        HttpRequest getProgReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/progression"))
                .header("Authorization", "Bearer " + token1)
                .GET()
                .build();
        HttpResponse<String> progRes = httpClient.send(getProgReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, progRes.statusCode());
        Map<String, Object> progBody = objectMapper.readValue(progRes.body(), Map.class);
        assertEquals(1, progBody.get("level"));
        assertEquals(0, progBody.get("totalXp"));

        // 2. Post an activity with 2.5 km running -> 250 points -> 250+ XP -> Level Up to Level 3!
        ActivityRequest actReq = new ActivityRequest();
        actReq.setSport(SportType.RUNNING);
        actReq.setDistanceKm(new BigDecimal("2.5")); // 250 pts

        HttpRequest postAct = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(actReq)))
                .build();
        HttpResponse<String> actRes = httpClient.send(postAct, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, actRes.statusCode());

        Map<String, Object> actBody = objectMapper.readValue(actRes.body(), Map.class);
        assertTrue((Integer) actBody.get("xpEarned") >= 250);
        assertEquals(true, actBody.get("levelUp"));
        assertTrue((Integer) actBody.get("level") >= 2);
        assertEquals(1, actBody.get("currentStreak"));

        // Unlocked achievements should contain FIRST_ACTIVITY and FIRST_100_XP
        List<Map<String, Object>> unlocked = (List<Map<String, Object>>) actBody.get("unlockedAchievements");
        assertNotNull(unlocked);
        assertTrue(unlocked.stream().anyMatch(a -> "FIRST_ACTIVITY".equals(a.get("code"))));
        assertTrue(unlocked.stream().anyMatch(a -> "FIRST_100_XP".equals(a.get("code"))));
    }

    @Test
    public void testStreakLogicConsecutiveAndSameDay() throws Exception {
        UserProgress progress = gamificationService.getOrCreateUserProgress(user1);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // Simulate activity yesterday
        progress.setCurrentStreak(2);
        progress.setLongestStreak(2);
        progress.setLastActivityDate(today.minusDays(1));
        userProgressRepository.save(progress);

        // 1. Post activity today -> streak should advance to 3
        ActivityRequest actReq = new ActivityRequest();
        actReq.setSport(SportType.WALKING);
        actReq.setDistanceKm(new BigDecimal("1.0"));

        HttpRequest postAct = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(actReq)))
                .build();
        HttpResponse<String> actRes = httpClient.send(postAct, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, actRes.statusCode());
        Map<String, Object> actBody = objectMapper.readValue(actRes.body(), Map.class);
        assertEquals(3, actBody.get("currentStreak"));
        assertEquals(3, actBody.get("longestStreak"));

        // 2. Post second activity on the same day -> streak should remain 3 (no double count)
        actRes = httpClient.send(postAct, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, actRes.statusCode());
        actBody = objectMapper.readValue(actRes.body(), Map.class);
        assertEquals(3, actBody.get("currentStreak"));
    }

    @Test
    public void testDailyQuestsProgressAndCompletion() throws Exception {
        // Fetch today quests
        HttpRequest getQuests = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/quests/today"))
                .header("Authorization", "Bearer " + token1)
                .GET()
                .build();
        HttpResponse<String> qRes = httpClient.send(getQuests, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, qRes.statusCode());
        List<Map<String, Object>> quests = objectMapper.readValue(qRes.body(), List.class);
        assertEquals(3, quests.size());

        // Complete a 20-minute gym workout with 100 points
        ActivityRequest actReq = new ActivityRequest();
        actReq.setSport(SportType.GYM);
        actReq.setDurationMinutes(20);
        actReq.setTotalDurationSeconds(1200);

        HttpRequest postAct = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(actReq)))
                .build();
        HttpResponse<String> actRes = httpClient.send(postAct, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, actRes.statusCode());
        Map<String, Object> actBody = objectMapper.readValue(actRes.body(), Map.class);

        List<Map<String, Object>> completedQuests = (List<Map<String, Object>>) actBody.get("completedQuests");
        assertNotNull(completedQuests);
        assertFalse(completedQuests.isEmpty());
    }

    @Test
    public void testActivityHistoryAndOwnershipIsolation() throws Exception {
        // User 1 logs an activity
        ActivityRequest act1 = new ActivityRequest();
        act1.setSport(SportType.WALKING);
        act1.setDistanceKm(new BigDecimal("2.0"));

        HttpRequest postAct1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(act1)))
                .build();
        HttpResponse<String> act1Res = httpClient.send(postAct1, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, act1Res.statusCode());
        Map<String, Object> act1Body = objectMapper.readValue(act1Res.body(), Map.class);
        String act1Id = (String) ((Map) act1Body.get("activity")).get("activityId");

        // User 1 gets their history
        HttpRequest getHist = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .GET()
                .build();
        HttpResponse<String> histRes = httpClient.send(getHist, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, histRes.statusCode());
        List<Map<String, Object>> history = objectMapper.readValue(histRes.body(), List.class);
        assertEquals(1, history.size());

        // User 2 gets their history -> should be empty
        HttpRequest getHist2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token2)
                .GET()
                .build();
        HttpResponse<String> hist2Res = httpClient.send(getHist2, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, hist2Res.statusCode());
        List<Map<String, Object>> history2 = objectMapper.readValue(hist2Res.body(), List.class);
        assertEquals(0, history2.size());

        // User 1 can view detail of their own activity
        HttpRequest getDetail1 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities/" + act1Id))
                .header("Authorization", "Bearer " + token1)
                .GET()
                .build();
        HttpResponse<String> detail1Res = httpClient.send(getDetail1, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, detail1Res.statusCode());

        // User 2 trying to view User 1's activity -> 403 Forbidden
        HttpRequest getDetail2 = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities/" + act1Id))
                .header("Authorization", "Bearer " + token2)
                .GET()
                .build();
        HttpResponse<String> detail2Res = httpClient.send(getDetail2, HttpResponse.BodyHandlers.ofString());
        assertEquals(403, detail2Res.statusCode());
    }

    @Test
    public void testAnalyticsEndpointAndLeaderboards() throws Exception {
        // User 1 logs a 3.0 km running activity
        ActivityRequest act1 = new ActivityRequest();
        act1.setSport(SportType.RUNNING);
        act1.setDistanceKm(new BigDecimal("3.0"));
        act1.setTotalDurationSeconds(1200);

        HttpRequest postAct = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/activities"))
                .header("Authorization", "Bearer " + token1)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(act1)))
                .build();
        httpClient.send(postAct, HttpResponse.BodyHandlers.ofString());

        // Fetch Analytics
        HttpRequest getAnalytics = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/analytics"))
                .header("Authorization", "Bearer " + token1)
                .GET()
                .build();
        HttpResponse<String> aRes = httpClient.send(getAnalytics, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, aRes.statusCode());
        Map<String, Object> aBody = objectMapper.readValue(aRes.body(), Map.class);
        assertEquals(1, aBody.get("totalActivities"));
        assertEquals(300, aBody.get("totalPoints"));
        List<Map<String, Object>> daily = (List<Map<String, Object>>) aBody.get("dailyVolumeLast7Days");
        assertEquals(7, daily.size());

        // Fetch Weekly Leaderboard
        HttpRequest getWeekly = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/leaderboard/weekly"))
                .GET()
                .build();
        HttpResponse<String> wRes = httpClient.send(getWeekly, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, wRes.statusCode());
        List<Map<String, Object>> weeklyBoard = objectMapper.readValue(wRes.body(), List.class);
        assertFalse(weeklyBoard.isEmpty());
        assertEquals("Player", weeklyBoard.get(0).get("firstName"));

        // Fetch Monthly Leaderboard
        HttpRequest getMonthly = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/leaderboard/monthly"))
                .GET()
                .build();
        HttpResponse<String> mRes = httpClient.send(getMonthly, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, mRes.statusCode());
        List<Map<String, Object>> monthlyBoard = objectMapper.readValue(mRes.body(), List.class);
        assertFalse(monthlyBoard.isEmpty());
    }
}
