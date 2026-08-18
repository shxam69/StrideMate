package com.stridemate.api.safety.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stridemate.api.safety.dto.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service("springEdgeNotificationProvider")
public class SpringEdgeNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(SpringEdgeNotificationProvider.class);

    private final String apiKey;
    private final String smsSenderId;
    private final String apiUrl;
    private final String whatsappNumber;
    private final String voiceNumber;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Pattern for Indian 10-digit mobile numbers starting with 6, 7, 8, 9
    private static final Pattern INDIAN_PHONE_PATTERN = Pattern.compile("^(?:\\+?91)?[6-9]\\d{9}$");

    public SpringEdgeNotificationProvider(
            @Value("${springedge.api-key:}") String apiKey,
            @Value("${springedge.sms-sender-id:SPREDG}") String smsSenderId,
            @Value("${springedge.api-url:https://api.springedge.com/v1/sms/send}") String apiUrl,
            @Value("${springedge.whatsapp-number:}") String whatsappNumber,
            @Value("${springedge.voice-number:}") String voiceNumber) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.smsSenderId = smsSenderId != null ? smsSenderId.trim() : "SPREDG";
        this.apiUrl = apiUrl != null ? apiUrl.trim() : "https://api.springedge.com/v1/sms/send";
        this.whatsappNumber = whatsappNumber != null ? whatsappNumber.trim() : "";
        this.voiceNumber = voiceNumber != null ? voiceNumber.trim() : "";

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(8000);
        this.restTemplate = new RestTemplate(factory);
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank() && !smsSenderId.isBlank();
    }

    @Override
    public NotificationResult sendSms(String toPhone, String message) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if (!isConfigured()) {
            log.warn("SpringEdge SMS provider unavailable: SPRINGEDGE_API_KEY is not configured");
            return NotificationResult.unavailable("SPRINGEDGE", "SpringEdge API Key is not configured on server");
        }

        // Validate and normalize recipient number
        String normalizedPhone = normalizeIndianPhoneNumber(toPhone);
        if (normalizedPhone == null) {
            log.error("SpringEdge SMS rejected: Invalid Indian phone number format '{}'", maskPhone(toPhone));
            return NotificationResult.failed("SPRINGEDGE", "INVALID_PHONE_FORMAT", "Recipient phone number must be a valid 10-digit Indian mobile number");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> payload = new HashMap<>();
            payload.put("to", normalizedPhone);
            payload.put("sender_id", smsSenderId);
            payload.put("message", message);
            payload.put("type", "transactional");

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String messageId = null;
                if (root.has("message_id")) {
                    messageId = root.get("message_id").asText();
                } else if (root.has("id")) {
                    messageId = root.get("id").asText();
                }

                String status = "ACCEPTED";
                if (root.has("status")) {
                    String rawStatus = root.get("status").asText();
                    if ("success".equalsIgnoreCase(rawStatus) || "sent".equalsIgnoreCase(rawStatus)) {
                        status = "SENT";
                    }
                }

                log.info("SpringEdge SMS accepted for {} | Message ID: {}", maskPhone(normalizedPhone), messageId);
                return NotificationResult.success("SPRINGEDGE", status, messageId);
            } else {
                log.error("SpringEdge SMS failed with status {}: {}", response.getStatusCode(), response.getBody());
                return NotificationResult.failed("SPRINGEDGE", String.valueOf(response.getStatusCode().value()), "SpringEdge server returned " + response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("SpringEdge SMS dispatch error to {}: {}", maskPhone(normalizedPhone), e.getMessage());
            return NotificationResult.failed("SPRINGEDGE", "DISPATCH_EXCEPTION", e.getMessage());
        }
    }

    @Override
    public NotificationResult sendWhatsApp(String toPhone, String message, Map<String, String> templateParams) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if (whatsappNumber.isBlank()) {
            return NotificationResult.unavailable("SPRINGEDGE", "SpringEdge WhatsApp sender number not configured");
        }

        // WhatsApp not enabled on this SpringEdge tier
        return NotificationResult.unavailable("SPRINGEDGE", "WhatsApp delivery channel currently unavailable for configured account");
    }

    @Override
    public NotificationResult makeEmergencyCall(String toPhone, String speechMessage) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if (voiceNumber.isBlank()) {
            return NotificationResult.unavailable("SPRINGEDGE", "SpringEdge Voice caller ID not configured");
        }

        // Voice not enabled on this SpringEdge tier
        return NotificationResult.unavailable("SPRINGEDGE", "Voice call delivery channel currently unavailable for configured account");
    }

    /**
     * Canonical Indian phone number normalization:
     * Accepts: "+919876543210", "919876543210", "9876543210", "09876543210", "98765-43210"
     * Returns: "+919876543210" if valid, or null if invalid.
     */
    public static String normalizeIndianPhoneNumber(String rawPhone) {
        if (rawPhone == null) return null;
        String digitsOnly = rawPhone.replaceAll("[^0-9+]", "");
        if (digitsOnly.startsWith("+")) {
            digitsOnly = digitsOnly.substring(1);
        }
        if (digitsOnly.startsWith("0")) {
            digitsOnly = digitsOnly.substring(1);
        }
        if (digitsOnly.startsWith("91") && digitsOnly.length() == 12) {
            digitsOnly = digitsOnly.substring(2);
        }

        if (digitsOnly.length() == 10 && digitsOnly.matches("^[6-9]\\d{9}$")) {
            return "+91" + digitsOnly;
        }

        // Check if full international E.164 (non-Indian)
        if (rawPhone.startsWith("+") && rawPhone.length() >= 10 && rawPhone.length() <= 16) {
            return rawPhone.replaceAll("[^0-9+]", "");
        }

        return null;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, Math.min(4, phone.length())) + "****" + phone.substring(Math.max(0, phone.length() - 3));
    }
}
