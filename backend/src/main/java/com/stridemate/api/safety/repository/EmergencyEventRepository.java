package com.stridemate.api.safety.repository;

import com.stridemate.api.safety.entity.EmergencyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent, UUID> {
    List<EmergencyEvent> findByUserIdOrderByTriggeredAtDesc(UUID userId);
}
