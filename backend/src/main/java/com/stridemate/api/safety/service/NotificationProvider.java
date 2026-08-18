package com.stridemate.api.safety.service;

import com.stridemate.api.safety.dto.NotificationResult;
import java.util.Map;

public interface NotificationProvider {
    NotificationResult sendSms(String toPhone, String message);
    NotificationResult sendWhatsApp(String toPhone, String message, Map<String, String> templateParams);
    NotificationResult makeEmergencyCall(String toPhone, String speechMessage);
}
