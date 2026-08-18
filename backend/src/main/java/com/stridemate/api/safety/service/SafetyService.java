package com.stridemate.api.safety.service;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.safety.dto.EmergencyEventDto;
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
        validateCoordinates(request.getLatitude(), request.getLongitude());

        // Cooldown check (prevent accidental double submission within 15 seconds)
        Instant lastTrigger = userLastTriggerMap.get(user.getId());
        if (lastTrigger != null && Instant.now().isBefore(lastTrigger.plusSeconds(COOLDOWN_SECONDS))) {
            log.warn("SOS trigger throttled for user {} due to cooldown.", user.getId());
        }
        userLastTriggerMap.put(user.getId(), Instant.now());

        // 1. Fetch user's emergency contacts
        List<EmergencyContact> contacts = emergencyContactRepository.findByUserOrderByIsPrimaryDescCreatedAtAsc(user);
        if (contacts.isEmpty()) {
            throw new IllegalArgumentException("No emergency contact configured. Please add an emergency contact in Profile before triggering SOS.");
        }

        EmergencyContact primaryContact = contacts.stream()
                .filter(EmergencyContact::isPrimary)
                .findFirst()
                .orElse(contacts.get(0));

        // 2. Fetch associated activity if present
        String sportName = null;
        if (request.getActivityId() != null) {
            Optional<Activity> actOpt = activityRepository.findById(request.getActivityId());
            if (actOpt.isPresent() && actOpt.get().getUser().getId().equals(user.getId())) {
                sportName = actOpt.get().getSport().name();
            }
        }

        // 3. Construct Google Maps Location URL & Message
        double lat = request.getLatitude();
        double lon = request.getLongitude();
        String locationUrl = String.format(Locale.US, "https://maps.google.com/?q=%.6f,%.6f", lat, lon);
        String accuracyText = request.getAccuracyMeters() != null 
                ? String.format(Locale.US, "±%.0fm", request.getAccuracyMeters()) 
                : "±10m";
        String timeText = DateTimeFormatter.ofPattern("HH:mm 'UTC'").withZone(ZoneOffset.UTC).format(Instant.now());

        StringBuilder msgBuilder = new StringBuilder();
        msgBuilder.append("🚨 STRIDEMATE SOS ALERT\n\n");
        msgBuilder.append(user.getFirstName()).append(" ").append(user.getLastName()).append(" has triggered an emergency alert.\n\n");
        msgBuilder.append("📍 Current Location:\n").append(locationUrl).append("\n\n");
        msgBuilder.append("Accuracy: ").append(accuracyText).append("\n");
        msgBuilder.append("Time: ").append(timeText).append("\n");
        if (sportName != null) {
            msgBuilder.append("Activity: ").append(sportName).append("\n");
        }
        msgBuilder.append("\nPlease check on them immediately.");

        String message = msgBuilder.toString();

        // 4. Create EmergencyEvent in database
        EmergencyEvent event = new EmergencyEvent(
                user,
                lat,
                lon,
                request.getAccuracyMeters(),
                request.getActivityId(),
                message
        );

        // 5. Dispatch Multichannel Alerts
        String phone = primaryContact.getPhoneNumber();
        String smsStatus = notificationProvider.sendSms(phone, message);
        String whatsappStatus = notificationProvider.sendWhatsApp(phone, message, Map.of(
                "user", user.getFirstName() + " " + user.getLastName(),
                "location", locationUrl,
                "time", timeText
        ));
        String callSpeech = String.format(
                "This is an automated StrideMate emergency alert. %s %s has triggered an SOS. Please check your text messages for their live location.",
                user.getFirstName(), user.getLastName()
        );
        String callStatus = notificationProvider.makeEmergencyCall(phone, callSpeech);

        event.setSmsStatus(smsStatus);
        event.setWhatsappStatus(whatsappStatus);
        event.setCallStatus(callStatus);

        boolean anySuccess = "SENT".equals(smsStatus) || "MOCK_SENT".equals(smsStatus)
                || "SENT".equals(whatsappStatus) || "MOCK_SENT".equals(whatsappStatus)
                || "SENT".equals(callStatus) || "MOCK_SENT".equals(callStatus);

        boolean allSuccess = ("SENT".equals(smsStatus) || "MOCK_SENT".equals(smsStatus) || "SKIPPED".equals(smsStatus))
                && ("SENT".equals(whatsappStatus) || "MOCK_SENT".equals(whatsappStatus) || "SKIPPED".equals(whatsappStatus))
                && ("SENT".equals(callStatus) || "MOCK_SENT".equals(callStatus) || "SKIPPED".equals(callStatus));

        String finalStatus = allSuccess ? "SENT" : (anySuccess ? "PARTIALLY_SENT" : "FAILED");
        event.setStatus(finalStatus);

        EmergencyEvent saved = emergencyEventRepository.save(event);

        SosResponseDto response = new SosResponseDto();
        response.setEventId(saved.getId());
        response.setStatus(finalStatus);
        response.setLocationUrl(locationUrl);
        response.setSms(smsStatus);
        response.setWhatsapp(whatsappStatus);
        response.setCall(callStatus);
        response.setMessage(message);
        response.setTriggeredAt(saved.getTriggeredAt());
        response.setContactName(primaryContact.getName());
        response.setContactPhone(primaryContact.getPhoneNumber());

        return response;
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

    private EmergencyEventDto toDto(EmergencyEvent event) {
        EmergencyEventDto dto = new EmergencyEventDto();
        dto.setId(event.getId());
        dto.setLatitude(event.getLatitude());
        dto.setLongitude(event.getLongitude());
        dto.setAccuracyMeters(event.getAccuracyMeters());
        dto.setActivityId(event.getActivityId());
        dto.setTriggeredAt(event.getTriggeredAt());
        dto.setStatus(event.getStatus());
        dto.setSmsStatus(event.getSmsStatus());
        dto.setWhatsappStatus(event.getWhatsappStatus());
        dto.setCallStatus(event.getCallStatus());
        dto.setMessage(event.getMessage());
        dto.setResolvedAt(event.getResolvedAt());
        return dto;
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("GPS coordinates are required to send an emergency SOS.");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Invalid latitude: must be between -90 and 90.");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Invalid longitude: must be between -180 and 180.");
        }
    }
}
