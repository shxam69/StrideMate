package com.stridemate.api.safety.repository;

import com.stridemate.api.safety.entity.EmergencyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent, UUID> {
    List<EmergencyEvent> findByUserIdOrderByTriggeredAtDesc(UUID userId);
    
    Optional<EmergencyEvent> findBySmsSid(String smsSid);
    Optional<EmergencyEvent> findByWhatsappSid(String whatsappSid);
    Optional<EmergencyEvent> findByCallSid(String callSid);

    Optional<EmergencyEvent> findFirstByUserIdAndClientRequestIdAndTriggeredAtAfter(
            UUID userId, String clientRequestId, Instant threshold);
}
