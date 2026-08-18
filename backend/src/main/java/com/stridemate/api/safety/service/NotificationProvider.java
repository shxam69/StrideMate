package com.stridemate.api.safety.service;

import java.util.Map;

public interface NotificationProvider {
    String sendSms(String toPhone, String message);
    String sendWhatsApp(String toPhone, String message, Map<String, String> templateParams);
    String makeEmergencyCall(String toPhone, String speechMessage);
}
