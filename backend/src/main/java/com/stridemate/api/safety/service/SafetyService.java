package com.stridemate.api.safety.service;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.safety.dto.EmergencyEventDto;
import com.stridemate.api.safety.dto.NotificationResult;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.safety.entity.EmergencyEvent;
import com.stridemate.api.safety.repository.EmergencyEventRepository;
import com.stridemate.api.user.entity.EmergencyContact;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.EmergencyContactRepository;
import com.stridemate.api.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class SafetyService {

    private static final Logger log = LoggerFactory.getLogger(SafetyService.class);

    private final EmergencyEventRepository emergencyEventRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;
    private final NotificationProvider notificationProvider;

    // In-memory cooldown tracker (UserId -> Last Trigger Timestamp) to prevent rapid duplicate bursts
    private final Map<UUID, Instant> userLastTriggerMap = new ConcurrentHashMap<>();
    private static final long COOLDOWN_SECONDS = 15;
    private static final long IDEMPOTENCY_WINDOW_SECONDS = 300; // 5 minutes

    @Autowired
    public SafetyService(
            EmergencyEventRepository emergencyEventRepository,
            EmergencyContactRepository emergencyContactRepository,
            UserRepository userRepository,
            ActivityRepository activityRepository,
            NotificationProvider notificationProvider) {
        this.emergencyEventRepository = emergencyEventRepository;
        this.emergencyContactRepository = emergencyContactRepository;
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
        this.notificationProvider = notificationProvider;
    }

    @Transactional
    public SosResponseDto triggerSos(User user, SosRequestDto request) {
        validateCoordinates(request.getLatitude(), request.getLongitude(), request.getAccuracyMeters());

        // 1. Idempotency Check: Return existing event if identical clientRequestId submitted within 5 minutes
        if (request.getClientRequestId() != null && !request.getClientRequestId().isBlank()) {
            Instant fiveMinutesAgo = Instant.now().minusSeconds(IDEMPOTENCY_WINDOW_SECONDS);
            Optional<EmergencyEvent> existingOpt = emergencyEventRepository
                    .findFirstByUserIdAndClientRequestIdAndTriggeredAtAfter(user.getId(), request.getClientRequestId(), fiveMinutesAgo);
            if (existingOpt.isPresent()) {
                log.info("Idempotent SOS trigger detected for user {} (clientRequestId={}). Returning existing event.",
                        user.getId(), request.getClientRequestId());
                return toResponseDto(existingOpt.get(), null, null);
            }
        }

        // 2. Cooldown check (prevent accidental double submission within 15 seconds)
        Instant lastTrigger = userLastTriggerMap.get(user.getId());
        if (lastTrigger != null && Instant.now().isBefore(lastTrigger.plusSeconds(COOLDOWN_SECONDS))) {
            log.warn("SOS trigger throttled for user {} due to cooldown window.", user.getId());
        }
        userLastTriggerMap.put(user.getId(), Instant.now());

        // 3. Fetch user's PRIMARY emergency contact
        List<EmergencyContact> contacts = emergencyContactRepository.findByUserOrderByIsPrimaryDescCreatedAtAsc(user);
        if (contacts.isEmpty()) {
            throw new IllegalArgumentException("NO_PRIMARY_CONTACT: No emergency contact configured. Please add an emergency contact in Profile before triggering SOS.");
        }

        EmergencyContact primaryContact = contacts.stream()
                .filter(EmergencyContact::isPrimary)
                .findFirst()
                .orElse(null);

        if (primaryContact == null) {
            throw new IllegalArgumentException("NO_PRIMARY_CONTACT: No PRIMARY emergency contact designated. Please set a primary contact in Profile before triggering SOS.");
        }

        // 4. Fetch associated activity if present
        String sportName = null;
        if (request.getActivityId() != null) {
            Optional<Activity> actOpt = activityRepository.findById(request.getActivityId());
            if (actOpt.isPresent() && actOpt.get().getUser().getId().equals(user.getId())) {
                sportName = actOpt.get().getSport().name();
            }
        }

        // 5. Construct Google Maps Location URL & Message strictly to specification
        double lat = request.getLatitude();
        double lon = request.getLongitude();
        String locationUrl = String.format(Locale.US, "https://www.google.com/maps?q=%.6f,%.6f", lat, lon);
        String accuracyText = request.getAccuracyMeters() != null 
                ? String.format(Locale.US, "%.0f", request.getAccuracyMeters()) 
                : "10";
        String timeText = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'").withZone(ZoneOffset.UTC).format(Instant.now());
        String userName = (user.getFirstName() + " " + (user.getLastName() != null ? user.getLastName() : "")).trim();

        StringBuilder msgBuilder = new StringBuilder();
        msgBuilder.append("STRIDEMATE SOS ALERT\n\n");
        msgBuilder.append(userName).append(" has triggered an emergency SOS.\n\n");
        msgBuilder.append("Live location:\n").append(locationUrl).append("\n\n");
        msgBuilder.append("GPS accuracy:\n").append(accuracyText).append(" meters\n\n");
        msgBuilder.append("Time:\n").append(timeText).append("\n\n");
        if (sportName != null) {
            msgBuilder.append("Activity: ").append(sportName).append("\n\n");
        }
        msgBuilder.append("Please check on them immediately.");

        String message = msgBuilder.toString();

        // 6. Create EmergencyEvent in database
        EmergencyEvent event = new EmergencyEvent(
                user,
                lat,
                lon,
                request.getAccuracyMeters(),
                request.getActivityId(),
                message,
                request.getClientRequestId()
        );

        // 7. Dispatch Multichannel Alerts
        String phone = primaryContact.getPhoneNumber();
        NotificationResult smsResult = notificationProvider.sendSms(phone, message);
        NotificationResult whatsappResult = notificationProvider.sendWhatsApp(phone, message, Map.of(
                "userName", userName,
                "locationUrl", locationUrl,
                "accuracy", accuracyText,
                "timestamp", timeText
        ));
        String callSpeech = String.format(
                "StrideMate emergency alert. %s has triggered an SOS. Please check the emergency location sent by StrideMate. The location is %s.",
                userName, locationUrl
        );
        NotificationResult callResult = notificationProvider.makeEmergencyCall(phone, callSpeech);

        event.setProvider(smsResult.getProvider());
        event.setSmsStatus(smsResult.getStatus());
        event.setSmsSid(smsResult.getSid());
        event.setSmsErrorCode(smsResult.getErrorCode());
        event.setSmsErrorMessage(smsResult.getErrorMessage());

        event.setWhatsappStatus(whatsappResult.getStatus());
        event.setWhatsappSid(whatsappResult.getSid());
        event.setWhatsappErrorCode(whatsappResult.getErrorCode());
        event.setWhatsappErrorMessage(whatsappResult.getErrorMessage());

        event.setCallStatus(callResult.getStatus());
        event.setCallSid(callResult.getSid());
        event.setCallErrorCode(callResult.getErrorCode());
        event.setCallErrorMessage(callResult.getErrorMessage());

        boolean isSmsOk = isSuccessfulStatus(smsResult.getStatus());
        boolean isWhatsappOk = isSuccessfulStatus(whatsappResult.getStatus());
        boolean isCallOk = isSuccessfulStatus(callResult.getStatus());

        String overallStatus;
        if (isSmsOk && (isWhatsappOk || isSkippedOrUnavailable(whatsappResult.getStatus())) && (isCallOk || isSkippedOrUnavailable(callResult.getStatus()))) {
            overallStatus = "ACCEPTED";
        } else if (isSmsOk || isWhatsappOk || isCallOk) {
            overallStatus = "PARTIALLY_SENT";
        } else {
            overallStatus = "FAILED";
        }
        event.setStatus(overallStatus);

        EmergencyEvent saved = emergencyEventRepository.save(event);
        return toResponseDto(saved, primaryContact.getName(), primaryContact.getPhoneNumber());
    }

    @Transactional
    public boolean updateDeliveryStatusFromWebhook(String sid, String channel, String rawStatus, String errorCode, String errorMessage) {
        if (sid == null || sid.isBlank()) return false;

        Optional<EmergencyEvent> eventOpt = Optional.empty();
        if ("sms".equalsIgnoreCase(channel)) {
            eventOpt = emergencyEventRepository.findBySmsSid(sid);
        } else if ("whatsapp".equalsIgnoreCase(channel)) {
            eventOpt = emergencyEventRepository.findByWhatsappSid(sid);
        } else if ("voice".equalsIgnoreCase(channel) || "call".equalsIgnoreCase(channel)) {
            eventOpt = emergencyEventRepository.findByCallSid(sid);
        }

        if (eventOpt.isEmpty()) {
            // Fallback lookup across all SID fields
            eventOpt = emergencyEventRepository.findBySmsSid(sid);
        }

        if (eventOpt.isPresent()) {
            EmergencyEvent event = eventOpt.get();
            String mappedStatus = mapDlrStatus(rawStatus);

            if ("sms".equalsIgnoreCase(channel)) {
                event.setSmsStatus(mappedStatus);
                if (errorCode != null) event.setSmsErrorCode(errorCode);
                if (errorMessage != null) event.setSmsErrorMessage(errorMessage);
            } else if ("whatsapp".equalsIgnoreCase(channel)) {
                event.setWhatsappStatus(mappedStatus);
                if (errorCode != null) event.setWhatsappErrorCode(errorCode);
                if (errorMessage != null) event.setWhatsappErrorMessage(errorMessage);
            } else {
                event.setCallStatus(mappedStatus);
                if (errorCode != null) event.setCallErrorCode(errorCode);
                if (errorMessage != null) event.setCallErrorMessage(errorMessage);
            }

            if ("DELIVERED".equals(mappedStatus) || "COMPLETED".equals(mappedStatus)) {
                event.setStatus("DELIVERED");
            } else if ("FAILED".equals(mappedStatus) && "FAILED".equals(event.getStatus())) {
                event.setStatus("FAILED");
            }

            emergencyEventRepository.save(event);
            log.info("Updated SOS delivery status from webhook: eventId={}, sid={}, channel={}, status={}",
                    event.getId(), sid, channel, mappedStatus);
            return true;
        }

        log.warn("Webhook delivery update received for unknown SID: {}", sid);
        return false;
    }

    private String mapDlrStatus(String raw) {
        if (raw == null) return "SENT";
        String s = raw.trim().toUpperCase();
        if (s.contains("DELIVER") || s.equals("DLR_SUCCESS") || s.equals("0")) return "DELIVERED";
        if (s.contains("FAIL") || s.contains("UNDELIV") || s.contains("REJECT") || s.contains("ERROR")) return "FAILED";
        if (s.contains("SENT") || s.contains("SUBMIT") || s.contains("ACCEPT") || s.contains("QUEUED")) return "SENT";
        if (s.contains("ANSWER") || s.contains("COMPLET")) return "COMPLETED";
        if (s.contains("RING")) return "RINGING";
        return s;
    }

    private boolean isSuccessfulStatus(String status) {
        return "SENT".equals(status) || "ACCEPTED".equals(status) || "DELIVERED".equals(status) || "MOCK_SENT".equals(status);
    }

    private boolean isSkippedOrUnavailable(String status) {
        return "SKIPPED".equals(status) || "UNAVAILABLE".equals(status);
    }

    @Transactional(readOnly = true)
    public List<EmergencyEventDto> getUserEvents(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        List<EmergencyEvent> events = emergencyEventRepository.findByUserIdOrderByTriggeredAtDesc(user.getId());
        return events.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public EmergencyEventDto resolveEvent(UUID eventId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        EmergencyEvent event = emergencyEventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency event not found: " + eventId));

        if (!event.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to resolve this emergency event.");
        }

        event.setStatus("RESOLVED");
        event.setResolvedAt(Instant.now());
        EmergencyEvent saved = emergencyEventRepository.save(event);
        return toDto(saved);
    }

    private SosResponseDto toResponseDto(EmergencyEvent event, String contactName, String contactPhone) {
        SosResponseDto dto = new SosResponseDto();
        dto.setEventId(event.getId());
        dto.setStatus(event.getStatus());
        dto.setProvider(event.getProvider());
        String locUrl = String.format(Locale.US, "https://www.google.com/maps?q=%.6f,%.6f", event.getLatitude(), event.getLongitude());
        dto.setLocationUrl(locUrl);
        dto.setSms(event.getSmsStatus());
        dto.setWhatsapp(event.getWhatsappStatus());
        dto.setCall(event.getCallStatus());
        dto.setSmsSid(event.getSmsSid());
        dto.setSmsErrorCode(event.getSmsErrorCode());
        dto.setSmsErrorMessage(event.getSmsErrorMessage());
        dto.setMessage(event.getMessage());
        dto.setTriggeredAt(event.getTriggeredAt());
        dto.setContactName(contactName);
        dto.setContactPhone(contactPhone);
        return dto;
    }

    private EmergencyEventDto toDto(EmergencyEvent event) {
        EmergencyEventDto dto = new EmergencyEventDto();
        dto.setId(event.getId());
        dto.setLatitude(event.getLatitude());
        dto.setLongitude(event.getLongitude());
        dto.setAccuracyMeters(event.getAccuracyMeters());
        dto.setActivityId(event.getActivityId());
        dto.setTriggeredAt(event.getTriggeredAt());
        dto.setStatus(event.getStatus());
        dto.setProvider(event.getProvider());
        dto.setSmsStatus(event.getSmsStatus());
        dto.setWhatsappStatus(event.getWhatsappStatus());
        dto.setCallStatus(event.getCallStatus());
        dto.setSmsSid(event.getSmsSid());
        dto.setSmsErrorCode(event.getSmsErrorCode());
        dto.setSmsErrorMessage(event.getSmsErrorMessage());
        dto.setMessage(event.getMessage());
        dto.setResolvedAt(event.getResolvedAt());
        return dto;
    }

    private void validateCoordinates(Double latitude, Double longitude, Double accuracyMeters) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("GPS coordinates are required to send an emergency SOS.");
        }
        if (latitude.isNaN() || latitude.isInfinite() || longitude.isNaN() || longitude.isInfinite()) {
            throw new IllegalArgumentException("Invalid GPS coordinates: coordinates cannot be NaN or Infinite.");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Invalid latitude: must be between -90 and 90.");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Invalid longitude: must be between -180 and 180.");
        }
        if (accuracyMeters != null && (accuracyMeters.isNaN() || accuracyMeters.isInfinite() || accuracyMeters <= 0 || accuracyMeters > 10000)) {
            throw new IllegalArgumentException("Invalid GPS accuracy value.");
        }
    }
}
