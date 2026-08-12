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

    @BeforeEach
    public void setup() {
        activityRepository.deleteAll();
        userRepository.deleteAll();
        httpClient = HttpClient.newHttpClient();
    }

    private String getBaseUrl() {
        return "http://localhost:" + port + "/api/auth";
    }

    @Test
    public void testSuccessfulRegistration() throws Exception {
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
        assertNotNull(body.get("token"));
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
        assertEquals(403, meRes.statusCode()); // or 401
    }
}
