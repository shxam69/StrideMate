package com.stridemate.api.safety.service;

import com.stridemate.api.safety.dto.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service("mockNotificationProvider")
public class MockNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(MockNotificationProvider.class);

    @Override
    public NotificationResult sendSms(String toPhone, String message) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }
        log.info("[MOCK SMS] Outbound alert to: {} | Message:\n{}", maskPhone(toPhone), message);
        return NotificationResult.mockSent("sms");
    }

    @Override
    public NotificationResult sendWhatsApp(String toPhone, String message, Map<String, String> templateParams) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }
        log.info("[MOCK WHATSAPP] Outbound alert to: {} | Message:\n{}", maskPhone(toPhone), message);
        return NotificationResult.mockSent("whatsapp");
    }

    @Override
    public NotificationResult makeEmergencyCall(String toPhone, String speechMessage) {
        if (toPhone == null || toPhone.isBlank()) {
            return NotificationResult.skipped("Empty recipient phone number");
        }
        log.info("[MOCK VOICE] Outbound call to: {} | Speech: '{}'", maskPhone(toPhone), speechMessage);
        return NotificationResult.mockSent("voice");
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, Math.min(3, phone.length())) + "****" + phone.substring(Math.max(0, phone.length() - 3));
    }
}
