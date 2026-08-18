package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.dto.UpdateProfileRequest;
import com.stridemate.api.user.dto.UserDto;
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
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class UserControllerTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.stridemate.api.activity.repository.ActivityRepository activityRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User testUser;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        emergencyContactRepository.deleteAll();
        activityRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFirstName("Alex");
        testUser.setLastName("Runner");
        testUser.setEmail("alex.user." + UUID.randomUUID() + "@example.com");
        testUser.setPhoneNumber("+1555" + UUID.randomUUID().toString().substring(0, 7));
        testUser.setPasswordHash(passwordEncoder.encode("Password123!"));
        testUser.setRole(Role.USER);
        userRepository.save(testUser);

        UserDetails userDetails = userDetailsService.loadUserByUsername(testUser.getEmail());
        jwtToken = jwtUtil.generateToken(userDetails);
    }

    @Test
    void testGetProfile_InitialIncompleteState() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users/me"))
                .header("Authorization", "Bearer " + jwtToken)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());

        UserDto dto = objectMapper.readValue(response.body(), UserDto.class);
        assertEquals("Alex", dto.getFirstName());
        assertEquals("Runner", dto.getLastName());
        assertEquals(testUser.getEmail(), dto.getEmail());
        assertNull(dto.getDateOfBirth());
        assertFalse(dto.isProfileCompleted());
    }

    @Test
    void testUpdateProfile_SetsDobAndOptionalFields() throws Exception {
        UpdateProfileRequest updateReq = new UpdateProfileRequest(
                LocalDate.of(1995, 5, 20),
                "Female",
                "https://example.com/avatar.png"
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users/me"))
                .header("Authorization", "Bearer " + jwtToken)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(updateReq)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());

        UserDto dto = objectMapper.readValue(response.body(), UserDto.class);
        assertEquals(LocalDate.of(1995, 5, 20), dto.getDateOfBirth());
        assertEquals("Female", dto.getGender());
        assertEquals("https://example.com/avatar.png", dto.getProfilePhoto());
        // Still false because no emergency contact added yet
        assertFalse(dto.isProfileCompleted());
    }

    @Test
    void testProfileCompletion_BecomesTrueWithDobAndEmergencyContact() throws Exception {
        // 1. Update DOB
        UpdateProfileRequest updateReq = new UpdateProfileRequest(
                LocalDate.of(1990, 1, 15),
                null, // Optional gender left null
                null  // Optional photo left null
        );

        HttpRequest updateRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users/me"))
                .header("Authorization", "Bearer " + jwtToken)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(updateReq)))
                .build();
        httpClient.send(updateRequest, HttpResponse.BodyHandlers.ofString());

        // 2. Add Emergency Contact
        EmergencyContactRequest contactReq = new EmergencyContactRequest(
                "Jane Doe",
                "Spouse",
                "+15559998888",
                true
        );

        HttpRequest contactRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts"))
                .header("Authorization", "Bearer " + jwtToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(contactReq)))
                .build();
        HttpResponse<String> contactResponse = httpClient.send(contactRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, contactResponse.statusCode(), "Response body was: " + contactResponse.body());

        // 3. Fetch profile -> must now be profileCompleted=true
        HttpRequest getRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users/me"))
                .header("Authorization", "Bearer " + jwtToken)
                .GET()
                .build();
        HttpResponse<String> getResponse = httpClient.send(getRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, getResponse.statusCode());

        UserDto dto = objectMapper.readValue(getResponse.body(), UserDto.class);
        assertTrue(dto.isProfileCompleted());
    }
}
