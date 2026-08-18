package com.stridemate.api.safety.service;

import com.stridemate.api.safety.dto.NotificationResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Primary
public class DelegatingNotificationProvider implements NotificationProvider {

    private static final Logger log = LoggerFactory.getLogger(DelegatingNotificationProvider.class);

    private final String mode;
    private final MockNotificationProvider mockProvider;
    private final SpringEdgeNotificationProvider springEdgeProvider;

    @Autowired
    public DelegatingNotificationProvider(
            @Value("${notification.provider.mode:mock}") String mode,
            MockNotificationProvider mockProvider,
            SpringEdgeNotificationProvider springEdgeProvider) {
        this.mode = mode != null ? mode.trim().toLowerCase() : "mock";
        this.mockProvider = mockProvider;
        this.springEdgeProvider = springEdgeProvider;
    }

    public String getMode() {
        return mode;
    }

    public boolean isRealMode() {
        return "real".equalsIgnoreCase(mode);
    }

    @Override
    public NotificationResult sendSms(String toPhone, String message) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockProvider.sendSms(toPhone, message);
        }

        if (!springEdgeProvider.isConfigured()) {
            log.warn("[REAL MODE] SpringEdge SMS provider requested but credentials are not configured");
            return NotificationResult.unavailable("SPRINGEDGE", "SpringEdge API credentials not configured on server (SPRINGEDGE_API_KEY missing)");
        }

        return springEdgeProvider.sendSms(toPhone, message);
    }

    @Override
    public NotificationResult sendWhatsApp(String toPhone, String message, Map<String, String> templateParams) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockProvider.sendWhatsApp(toPhone, message, templateParams);
        }

        return springEdgeProvider.sendWhatsApp(toPhone, message, templateParams);
    }

    @Override
    public NotificationResult makeEmergencyCall(String toPhone, String speechMessage) {
        if ("mock".equalsIgnoreCase(mode)) {
            return mockProvider.makeEmergencyCall(toPhone, speechMessage);
        }

        return springEdgeProvider.makeEmergencyCall(toPhone, speechMessage);
    }
}
