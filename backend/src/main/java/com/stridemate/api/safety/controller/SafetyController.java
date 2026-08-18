package com.stridemate.api.safety.controller;

import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.safety.dto.EmergencyEventDto;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.safety.service.DelegatingNotificationProvider;
import com.stridemate.api.safety.service.SafetyService;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import com.stridemate.api.user.dto.EmergencyContactDto;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.service.EmergencyContactService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/safety")
public class SafetyController {

    private static final Logger log = LoggerFactory.getLogger(SafetyController.class);

    private final SafetyService safetyService;
    private final UserRepository userRepository;
    private final EmergencyContactService emergencyContactService;
    private final DelegatingNotificationProvider delegatingProvider;

    @Autowired
    public SafetyController(
            SafetyService safetyService, 
            UserRepository userRepository,
            EmergencyContactService emergencyContactService,
            DelegatingNotificationProvider delegatingProvider) {
        this.safetyService = safetyService;
        this.userRepository = userRepository;
        this.emergencyContactService = emergencyContactService;
        this.delegatingProvider = delegatingProvider;
    }

    @GetMapping("/mode")
    public ResponseEntity<Map<String, Object>> getProviderMode() {
        return ResponseEntity.ok(Map.of(
                "mode", delegatingProvider.getMode(),
                "isReal", delegatingProvider.isRealMode(),
                "provider", "SPRINGEDGE"
        ));
    }

    @PostMapping("/sos")
    public ResponseEntity<SosResponseDto> triggerSos(@RequestBody SosRequestDto request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        return ResponseEntity.ok(safetyService.triggerSos(user, request));
    }

    @GetMapping("/sos")
    public ResponseEntity<List<EmergencyEventDto>> getSosHistory(Authentication authentication) {
        return ResponseEntity.ok(safetyService.getUserEvents(authentication.getName()));
    }

    @GetMapping("/events")
    public ResponseEntity<List<EmergencyEventDto>> getUserSafetyEvents(Authentication authentication) {
        return ResponseEntity.ok(safetyService.getUserEvents(authentication.getName()));
    }

    @PostMapping("/events/{id}/resolve")
    public ResponseEntity<EmergencyEventDto> resolveEvent(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(safetyService.resolveEvent(id, authentication.getName()));
    }

    @GetMapping("/emergency-contacts")
    public ResponseEntity<List<EmergencyContactDto>> getEmergencyContacts(Authentication authentication) {
        return ResponseEntity.ok(emergencyContactService.getContacts(authentication.getName()));
    }

    @PostMapping("/emergency-contacts")
    public ResponseEntity<EmergencyContactDto> createEmergencyContact(
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication) {
        EmergencyContactDto created = emergencyContactService.createContact(authentication.getName(), request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // =========================================================================
    // PROVIDER DELIVERY CALLBACK / DLR ENDPOINTS
    // =========================================================================

    @PostMapping(value = "/callbacks/sms", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<Map<String, Object>> handleSmsDlrCallback(
            @RequestParam(required = false) String message_id,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String sid,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String error_code,
            @RequestParam(required = false) String error_message,
            @RequestBody(required = false) Map<String, Object> body) {
        
        String resolvedSid = sid != null ? sid : (message_id != null ? message_id : id);
        String resolvedStatus = status;
        String resolvedErrCode = error_code;
        String resolvedErrMsg = error_message;

        if (body != null) {
            if (resolvedSid == null && body.containsKey("message_id")) resolvedSid = String.valueOf(body.get("message_id"));
            if (resolvedSid == null && body.containsKey("id")) resolvedSid = String.valueOf(body.get("id"));
            if (resolvedStatus == null && body.containsKey("status")) resolvedStatus = String.valueOf(body.get("status"));
            if (resolvedErrCode == null && body.containsKey("error_code")) resolvedErrCode = String.valueOf(body.get("error_code"));
            if (resolvedErrMsg == null && body.containsKey("message")) resolvedErrMsg = String.valueOf(body.get("message"));
        }

        log.info("Received SMS DLR Callback: sid={}, status={}", resolvedSid, resolvedStatus);
        boolean updated = safetyService.updateDeliveryStatusFromWebhook(resolvedSid, "sms", resolvedStatus, resolvedErrCode, resolvedErrMsg);
        return ResponseEntity.ok(Map.of("acknowledged", true, "updated", updated));
    }

    @PostMapping(value = "/callbacks/whatsapp", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<Map<String, Object>> handleWhatsAppDlrCallback(
            @RequestParam(required = false) String message_id,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String error_code,
            @RequestParam(required = false) String error_message,
            @RequestBody(required = false) Map<String, Object> body) {

        String resolvedSid = message_id != null ? message_id : id;
        String resolvedStatus = status;
        if (body != null && resolvedSid == null && body.containsKey("message_id")) {
            resolvedSid = String.valueOf(body.get("message_id"));
        }
        if (body != null && resolvedStatus == null && body.containsKey("status")) {
            resolvedStatus = String.valueOf(body.get("status"));
        }

        boolean updated = safetyService.updateDeliveryStatusFromWebhook(resolvedSid, "whatsapp", resolvedStatus, error_code, error_message);
        return ResponseEntity.ok(Map.of("acknowledged", true, "updated", updated));
    }

    @PostMapping(value = "/callbacks/voice", consumes = {MediaType.APPLICATION_FORM_URLENCODED_VALUE, MediaType.APPLICATION_JSON_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<Map<String, Object>> handleVoiceCallback(
            @RequestParam(required = false) String call_id,
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String error_code,
            @RequestParam(required = false) String error_message,
            @RequestBody(required = false) Map<String, Object> body) {

        String resolvedSid = call_id != null ? call_id : id;
        String resolvedStatus = status;
        if (body != null && resolvedSid == null && body.containsKey("call_id")) {
            resolvedSid = String.valueOf(body.get("call_id"));
        }
        if (body != null && resolvedStatus == null && body.containsKey("status")) {
            resolvedStatus = String.valueOf(body.get("status"));
        }

        boolean updated = safetyService.updateDeliveryStatusFromWebhook(resolvedSid, "voice", resolvedStatus, error_code, error_message);
        return ResponseEntity.ok(Map.of("acknowledged", true, "updated", updated));
    }
}
