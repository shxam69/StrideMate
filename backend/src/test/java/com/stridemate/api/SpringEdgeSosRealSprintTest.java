package com.stridemate.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.stridemate.api.auth.security.JwtUtil;
import com.stridemate.api.safety.dto.NotificationResult;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.safety.entity.EmergencyEvent;
import com.stridemate.api.safety.repository.EmergencyEventRepository;
import com.stridemate.api.safety.service.MockNotificationProvider;
import com.stridemate.api.safety.service.SpringEdgeNotificationProvider;
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
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestTemplate;

import java.lang.reflect.Field;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class SpringEdgeSosRealSprintTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyEventRepository emergencyEventRepository;

    @Autowired
    private EmergencyContactRepository emergencyContactRepository;

    @Autowired
    private EmergencyContactService emergencyContactService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private MockNotificationProvider mockNotificationProvider;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User testUser;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        emergencyEventRepository.deleteAll();
        emergencyContactRepository.deleteAll();
        userRepository.deleteAll();

        testUser = new User();
        testUser.setFirstName("Vikram");
        testUser.setLastName("Sharma");
        testUser.setEmail("vikram." + UUID.randomUUID() + "@example.com");
        testUser.setPasswordHash(passwordEncoder.encode("Secret123!"));
        testUser.setRole(Role.USER);
        userRepository.save(testUser);

        UserDetails ud = userDetailsService.loadUserByUsername(testUser.getEmail());
        jwtToken = jwtUtil.generateToken(ud);
    }

    @Test
    void testMockNotificationProvider_ReturnsMockSentWithoutNetworkCalls() {
        NotificationResult res = mockNotificationProvider.sendSms("9876543210", "Test Emergency Alert");
        assertEquals("MOCK", res.getProvider());
        assertEquals("MOCK_SENT", res.getStatus());
        assertNotNull(res.getSid());
        assertTrue(res.getSid().startsWith("mock-sms-"));
    }

    @Test
    void testIndianPhoneNumberNormalization() {
        // Valid 10-digit Indian numbers
        assertEquals("+919876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("9876543210"));
        assertEquals("+919876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("+919876543210"));
        assertEquals("+919876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("919876543210"));
        assertEquals("+919876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("09876543210"));
        assertEquals("+919876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("+91 98765-43210"));
        assertEquals("+918876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("8876543210"));
        assertEquals("+917876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("7876543210"));
        assertEquals("+916876543210", SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("6876543210"));

        // Invalid numbers (starting with 1-5, or wrong lengths)
        assertNull(SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("1234567890"));
        assertNull(SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("5234567890"));
        assertNull(SpringEdgeNotificationProvider.normalizeIndianPhoneNumber("98765"));
        assertNull(SpringEdgeNotificationProvider.normalizeIndianPhoneNumber(""));
        assertNull(SpringEdgeNotificationProvider.normalizeIndianPhoneNumber(null));
    }

    @Test
    void testSpringEdgeNotificationProvider_MissingCredentials_ReturnsUnavailable() {
        SpringEdgeNotificationProvider provider = new SpringEdgeNotificationProvider(
                "", "SPREDG", "https://api.springedge.com/v1/sms/send", "", ""
        );
        assertFalse(provider.isConfigured());

        NotificationResult res = provider.sendSms("9876543210", "Test Emergency Alert");
        assertEquals("UNAVAILABLE", res.getStatus());
        assertEquals("CONFIG_MISSING", res.getErrorCode());
    }

    @Test
    void testSpringEdgeNotificationProvider_SuccessfulRestDispatch_ReturnsAcceptedAndSid() throws Exception {
        SpringEdgeNotificationProvider provider = new SpringEdgeNotificationProvider(
                "test_api_key_123", "SPREDG", "https://api.springedge.com/v1/sms/send", "", ""
        );

        // Inject MockRestServiceServer into the internal RestTemplate of provider
        Field restTemplateField = SpringEdgeNotificationProvider.class.getDeclaredField("restTemplate");
        restTemplateField.setAccessible(true);
        RestTemplate restTemplate = (RestTemplate) restTemplateField.get(provider);

        MockRestServiceServer mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(MockRestRequestMatchers.requestTo("https://api.springedge.com/v1/sms/send"))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("Authorization", "Bearer test_api_key_123"))
                .andRespond(MockRestResponseCreators.withSuccess(
                        "{\"status\":\"success\",\"message_id\":\"msg_se_987654\",\"credits_used\":1}",
                        MediaType.APPLICATION_JSON
                ));

        NotificationResult result = provider.sendSms("9876543210", "STRIDEMATE SOS ALERT");
        mockServer.verify();

        assertEquals("SPRINGEDGE", result.getProvider());
        assertEquals("SENT", result.getStatus());
        assertEquals("msg_se_987654", result.getSid());
        assertNull(result.getErrorCode());
    }

    @Test
    void testSpringEdgeNotificationProvider_ApiError_ReturnsFailedWithCode() throws Exception {
        SpringEdgeNotificationProvider provider = new SpringEdgeNotificationProvider(
                "test_api_key_123", "SPREDG", "https://api.springedge.com/v1/sms/send", "", ""
        );

        Field restTemplateField = SpringEdgeNotificationProvider.class.getDeclaredField("restTemplate");
        restTemplateField.setAccessible(true);
        RestTemplate restTemplate = (RestTemplate) restTemplateField.get(provider);

        MockRestServiceServer mockServer = MockRestServiceServer.createServer(restTemplate);
        mockServer.expect(MockRestRequestMatchers.requestTo("https://api.springedge.com/v1/sms/send"))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andRespond(MockRestResponseCreators.withBadRequest()
                        .body("{\"status\":\"error\",\"error_code\":\"102\",\"message\":\"Invalid Sender ID\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        NotificationResult result = provider.sendSms("9876543210", "STRIDEMATE SOS ALERT");

        assertEquals("SPRINGEDGE", result.getProvider());
        assertEquals("FAILED", result.getStatus());
    }

    @Test
    void testSosDispatch_StrictGpsValidation_RejectsInvalidCoordinates() throws Exception {
        // Create primary contact first
        emergencyContactService.createContact(testUser.getEmail(), new EmergencyContactRequest(
                "Ananya Sharma", "Spouse", "+919876543210", true
        ));

        // 1. Latitude > 90
        SosRequestDto req1 = new SosRequestDto(95.0, 77.2090, 5.0, null, "req-1");
        HttpResponse<String> res1 = postSos(req1);
        assertEquals(400, res1.statusCode());

        // 2. Longitude < -180
        SosRequestDto req2 = new SosRequestDto(28.6139, -195.0, 5.0, null, "req-2");
        HttpResponse<String> res2 = postSos(req2);
        assertEquals(400, res2.statusCode());

        // 3. Null coordinates
        SosRequestDto req3 = new SosRequestDto(null, 77.2090, 5.0, null, "req-3");
        HttpResponse<String> res3 = postSos(req3);
        assertEquals(400, res3.statusCode());
    }

    @Test
    void testSosDispatch_NoPrimaryContact_Throws400() throws Exception {
        // Save a non-primary contact directly in repo (isPrimary = false)
        com.stridemate.api.user.entity.EmergencyContact contact = new com.stridemate.api.user.entity.EmergencyContact(
                testUser, "Rahul Friend", "Friend", "+919876543210", false
        );
        emergencyContactRepository.save(contact);

        SosRequestDto req = new SosRequestDto(28.6139, 77.2090, 5.0, null, "req-no-primary");
        HttpResponse<String> res = postSos(req);
        assertEquals(400, res.statusCode());
        assertTrue(res.body().contains("NO_PRIMARY_CONTACT"));
    }

    @Test
    void testSosDispatch_Idempotency_SameClientRequestIdReturnsExistingEvent() throws Exception {
        emergencyContactService.createContact(testUser.getEmail(), new EmergencyContactRequest(
                "Ananya Sharma", "Spouse", "+919876543210", true
        ));

        String idempotencyKey = "client-req-unique-9988";
        SosRequestDto req = new SosRequestDto(28.6139, 77.2090, 5.0, null, idempotencyKey);

        // First dispatch
        HttpResponse<String> res1 = postSos(req);
        assertEquals(200, res1.statusCode());
        SosResponseDto dto1 = objectMapper.readValue(res1.body(), SosResponseDto.class);
        assertNotNull(dto1.getEventId());

        // Duplicate dispatch with exact same idempotencyKey
        HttpResponse<String> res2 = postSos(req);
        assertEquals(200, res2.statusCode());
        SosResponseDto dto2 = objectMapper.readValue(res2.body(), SosResponseDto.class);

        // Must return identical Event ID without creating a duplicate record
        assertEquals(dto1.getEventId(), dto2.getEventId());
        assertEquals(1, emergencyEventRepository.findByUserIdOrderByTriggeredAtDesc(testUser.getId()).size());
    }

    @Test
    void testWebhookCallback_UpdatesIncidentStatusToDelivered() throws Exception {
        emergencyContactService.createContact(testUser.getEmail(), new EmergencyContactRequest(
                "Ananya Sharma", "Spouse", "+919876543210", true
        ));

        SosRequestDto req = new SosRequestDto(28.6139, 77.2090, 5.0, null, "req-webhook-test");
        HttpResponse<String> res = postSos(req);
        assertEquals(200, res.statusCode());
        SosResponseDto dto = objectMapper.readValue(res.body(), SosResponseDto.class);

        // Manually assign a test message SID to event
        EmergencyEvent event = emergencyEventRepository.findById(dto.getEventId()).orElseThrow();
        event.setSmsSid("msg_se_callback_123");
        emergencyEventRepository.save(event);

        // Simulate SpringEdge DLR webhook POST
        HttpRequest callbackReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/callbacks/sms"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"message_id\":\"msg_se_callback_123\",\"status\":\"delivered\"}"))
                .build();

        HttpResponse<String> callbackRes = httpClient.send(callbackReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, callbackRes.statusCode());

        // Verify that event status is updated in DB
        EmergencyEvent updated = emergencyEventRepository.findById(dto.getEventId()).orElseThrow();
        assertEquals("DELIVERED", updated.getSmsStatus());
        assertEquals("DELIVERED", updated.getStatus());
    }

    @Test
    void testProviderModeEndpoint_ReturnsSafeMetadataWithoutSecrets() throws Exception {
        HttpRequest modeReq = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/mode"))
                .GET()
                .build();

        HttpResponse<String> modeRes = httpClient.send(modeReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, modeRes.statusCode());

        Map<String, Object> map = objectMapper.readValue(modeRes.body(), Map.class);
        assertEquals("mock", map.get("mode"));
        assertEquals(false, map.get("isReal"));
        assertEquals("SPRINGEDGE", map.get("provider"));
        // Ensure no API keys or tokens are leaked
        assertFalse(map.containsKey("apiKey"));
        assertFalse(map.containsKey("authToken"));
    }

    private HttpResponse<String> postSos(SosRequestDto req) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/safety/sos"))
                .header("Authorization", "Bearer " + jwtToken)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(req)))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }
}
