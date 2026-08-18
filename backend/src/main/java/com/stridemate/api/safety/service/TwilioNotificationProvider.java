package com.stridemate.api.safety.service;

import com.stridemate.api.safety.dto.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@Service("twilioNotificationProvider")
public class TwilioNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioNotificationProvider.class);

    private final String accountSid;
    private final String authToken;
    private final String smsFrom;
    private final String whatsappFrom;
    private final String voiceFrom;
    private final String mode;
    private final RestTemplate restTemplate;

    public TwilioNotificationProvider(
            @Value("${twilio.account-sid:}") String accountSid,
            @Value("${twilio.auth-token:}") String authToken,
            @Value("${twilio.sms-from:}") String smsFrom,
            @Value("${twilio.whatsapp-from:}") String whatsappFrom,
            @Value("${twilio.voice-from:}") String voiceFrom,
            @Value("${notification.provider.mode:mock}") String mode) {
        this.accountSid = accountSid != null ? accountSid.trim() : "";
        this.authToken = authToken != null ? authToken.trim() : "";
        this.smsFrom = smsFrom != null ? smsFrom.trim() : "";
        this.whatsappFrom = whatsappFrom != null ? whatsappFrom.trim() : "";
        this.voiceFrom = voiceFrom != null ? voiceFrom.trim() : "";
        this.mode = mode != null ? mode.trim().toLowerCase() : "mock";

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    private boolean isRealModeConfigured() {
        return "real".equalsIgnoreCase(mode) && !accountSid.isBlank() && !authToken.isBlank();
    }

    @Override
    public NotificationResult sendSms(String toPhone, String message) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if ("mock".equalsIgnoreCase(mode)) {
            log.info("[MOCK SMS] Outbound alert to: {} | Message:\n{}", maskPhone(toPhone), message);
            return NotificationResult.mockSent("sms");
        }

        if (!isRealModeConfigured()) {
            log.warn("Twilio SMS provider unavailable (API credentials not configured)");
            return NotificationResult.unavailable("TWILIO", "Twilio API credentials not configured");
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("To", toPhone);
            body.add("From", smsFrom.isBlank() ? "+15005550006" : smsFrom);
            body.add("Body", message);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Twilio SMS successfully dispatched to {}", maskPhone(toPhone));
                return NotificationResult.success("TWILIO", "SENT", "twilio-sms-sent");
            } else {
                log.warn("Twilio SMS failed with status {}: {}", response.getStatusCode(), response.getBody());
                return NotificationResult.failed("TWILIO", String.valueOf(response.getStatusCode().value()), response.getBody());
            }
        } catch (Exception e) {
            log.error("Twilio SMS error to {}: {}", maskPhone(toPhone), e.getMessage());
            return NotificationResult.failed("TWILIO", "EXCEPTION", e.getMessage());
        }
    }

    @Override
    public NotificationResult sendWhatsApp(String toPhone, String message, Map<String, String> templateParams) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if ("mock".equalsIgnoreCase(mode)) {
            log.info("[MOCK WHATSAPP] Outbound alert to: {} | Message:\n{}", maskPhone(toPhone), message);
            return NotificationResult.mockSent("whatsapp");
        }

        if (!isRealModeConfigured()) {
            log.warn("Twilio WhatsApp provider unavailable (API credentials not configured)");
            return NotificationResult.unavailable("TWILIO", "Twilio API credentials not configured");
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String formattedTo = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + toPhone;
            String formattedFrom = whatsappFrom.startsWith("whatsapp:") ? whatsappFrom : "whatsapp:" + (whatsappFrom.isBlank() ? "+14155238886" : whatsappFrom);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("To", formattedTo);
            body.add("From", formattedFrom);
            body.add("Body", message);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Twilio WhatsApp message successfully dispatched to {}", maskPhone(toPhone));
                return NotificationResult.success("TWILIO", "SENT", "twilio-wa-sent");
            } else {
                log.warn("Twilio WhatsApp failed with status {}: {}", response.getStatusCode(), response.getBody());
                return NotificationResult.failed("TWILIO", String.valueOf(response.getStatusCode().value()), response.getBody());
            }
        } catch (Exception e) {
            log.error("Twilio WhatsApp error to {}: {}", maskPhone(toPhone), e.getMessage());
            return NotificationResult.failed("TWILIO", "EXCEPTION", e.getMessage());
        }
    }

    @Override
    public NotificationResult makeEmergencyCall(String toPhone, String speechMessage) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }

        if ("mock".equalsIgnoreCase(mode)) {
            log.info("[MOCK CALL] Emergency Voice call to: {} | Speech: '{}'", maskPhone(toPhone), speechMessage);
            return NotificationResult.mockSent("voice");
        }

        if (!isRealModeConfigured()) {
            log.warn("Twilio Voice Call provider unavailable (API credentials not configured)");
            return NotificationResult.unavailable("TWILIO", "Twilio API credentials not configured");
        }

        try {
            String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Calls.json";
            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String twiml = "<Response><Say voice=\"alice\">" + speechMessage + "</Say></Response>";

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("To", toPhone);
            body.add("From", voiceFrom.isBlank() ? "+15005550006" : voiceFrom);
            body.add("Twiml", twiml);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Twilio Voice call successfully initiated to {}", maskPhone(toPhone));
                return NotificationResult.success("TWILIO", "INITIATED", "twilio-call-sent");
            } else {
                log.warn("Twilio Voice call failed with status {}: {}", response.getStatusCode(), response.getBody());
                return NotificationResult.failed("TWILIO", String.valueOf(response.getStatusCode().value()), response.getBody());
            }
        } catch (Exception e) {
            log.error("Twilio Voice call error to {}: {}", maskPhone(toPhone), e.getMessage());
            return NotificationResult.failed("TWILIO", "EXCEPTION", e.getMessage());
        }
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String auth = accountSid + ":" + authToken;
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.US_ASCII));
        headers.set(HttpHeaders.AUTHORIZATION, "Basic " + new String(encodedAuth));
        return headers;
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, Math.min(3, phone.length())) + "****" + phone.substring(Math.max(0, phone.length() - 3));
    }
}
