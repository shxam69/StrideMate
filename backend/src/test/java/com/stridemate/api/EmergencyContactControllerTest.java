package com.stridemate.api;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.user.dto.EmergencyContactDto;
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
public class EmergencyContactControllerTest {

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

    private User userA;
    private String tokenA;

    private User userB;
    private String tokenB;

    @BeforeEach
    void setUp() {
        emergencyContactRepository.deleteAll();
        activityRepository.deleteAll();
        userRepository.deleteAll();

        userA = new User();
        userA.setFirstName("Alice");
        userA.setLastName("Alpha");
        userA.setEmail("alice." + UUID.randomUUID() + "@example.com");
        userA.setPhoneNumber("+1555" + UUID.randomUUID().toString().substring(0, 7));
        userA.setPasswordHash(passwordEncoder.encode("Password123!"));
        userA.setRole(Role.USER);
        userRepository.save(userA);

        UserDetails detailsA = userDetailsService.loadUserByUsername(userA.getEmail());
        tokenA = jwtUtil.generateToken(detailsA);

        userB = new User();
        userB.setFirstName("Bob");
        userB.setLastName("Beta");
        userB.setEmail("bob." + UUID.randomUUID() + "@example.com");
        userB.setPhoneNumber("+1555" + UUID.randomUUID().toString().substring(0, 7));
        userB.setPasswordHash(passwordEncoder.encode("Password123!"));
        userB.setRole(Role.USER);
        userRepository.save(userB);

        UserDetails detailsB = userDetailsService.loadUserByUsername(userB.getEmail());
        tokenB = jwtUtil.generateToken(detailsB);
    }

    @Test
    void testEmergencyContact_CrudAndUserIsolation() throws Exception {
        // 1. User A creates a contact
        EmergencyContactRequest createReq = new EmergencyContactRequest(
                "Doctor Mike",
                "Physician",
                "+15551112222",
                true
        );

        HttpRequest createHttpReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts"))
                .header("Authorization", "Bearer " + tokenA)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(createReq)))
                .build();

        HttpResponse<String> createRes = httpClient.send(createHttpReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(201, createRes.statusCode());

        EmergencyContactDto createdDto = objectMapper.readValue(createRes.body(), EmergencyContactDto.class);
        assertNotNull(createdDto.getId());
        assertEquals("Doctor Mike", createdDto.getName());
        assertEquals("Physician", createdDto.getRelationship());
        assertTrue(createdDto.isPrimary());

        // 2. User A fetches contacts -> should see 1
        HttpRequest listA = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts"))
                .header("Authorization", "Bearer " + tokenA)
                .GET()
                .build();
        HttpResponse<String> listResA = httpClient.send(listA, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, listResA.statusCode());
        List<EmergencyContactDto> contactsA = objectMapper.readValue(listResA.body(), new TypeReference<List<EmergencyContactDto>>() {});
        assertEquals(1, contactsA.size());

        // 3. User B fetches contacts -> should see 0 (Strict Isolation!)
        HttpRequest listB = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts"))
                .header("Authorization", "Bearer " + tokenB)
                .GET()
                .build();
        HttpResponse<String> listResB = httpClient.send(listB, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, listResB.statusCode());
        List<EmergencyContactDto> contactsB = objectMapper.readValue(listResB.body(), new TypeReference<List<EmergencyContactDto>>() {});
        assertEquals(0, contactsB.size());

        // 4. User B attempts to update User A's contact -> should fail (404/not found)
        EmergencyContactRequest badUpdate = new EmergencyContactRequest("Hacked", "Enemy", "+1000000", false);
        HttpRequest updateB = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts/" + createdDto.getId()))
                .header("Authorization", "Bearer " + tokenB)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(badUpdate)))
                .build();
        HttpResponse<String> updateResB = httpClient.send(updateB, HttpResponse.BodyHandlers.ofString());
        assertEquals(404, updateResB.statusCode());

        // 5. User B attempts to delete User A's contact -> should fail (404/not found)
        HttpRequest deleteB = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts/" + createdDto.getId()))
                .header("Authorization", "Bearer " + tokenB)
                .DELETE()
                .build();
        HttpResponse<String> deleteResB = httpClient.send(deleteB, HttpResponse.BodyHandlers.ofString());
        assertEquals(404, deleteResB.statusCode());

        // 6. User A updates their own contact -> succeeds
        EmergencyContactRequest goodUpdate = new EmergencyContactRequest("Dr. Michael Smith", "Cardiologist", "+15553334444", true);
        HttpRequest updateA = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts/" + createdDto.getId()))
                .header("Authorization", "Bearer " + tokenA)
                .header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(goodUpdate)))
                .build();
        HttpResponse<String> updateResA = httpClient.send(updateA, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, updateResA.statusCode());
        EmergencyContactDto updatedDto = objectMapper.readValue(updateResA.body(), EmergencyContactDto.class);
        assertEquals("Dr. Michael Smith", updatedDto.getName());
        assertEquals("Cardiologist", updatedDto.getRelationship());

        // 7. User A deletes their contact -> succeeds
        HttpRequest deleteA = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/emergency-contacts/" + createdDto.getId()))
                .header("Authorization", "Bearer " + tokenA)
                .DELETE()
                .build();
        HttpResponse<String> deleteResA = httpClient.send(deleteA, HttpResponse.BodyHandlers.ofString());
        assertEquals(204, deleteResA.statusCode());

        // Verify count is 0
        assertEquals(0, emergencyContactRepository.count());
    }
}
