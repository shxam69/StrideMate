package com.stridemate.api.safety.controller;

import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.safety.dto.EmergencyEventDto;
import com.stridemate.api.safety.dto.SosRequestDto;
import com.stridemate.api.safety.dto.SosResponseDto;
import com.stridemate.api.safety.service.SafetyService;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/safety")
public class SafetyController {

    private final SafetyService safetyService;
    private final UserRepository userRepository;

    @Autowired
    public SafetyController(SafetyService safetyService, UserRepository userRepository) {
        this.safetyService = safetyService;
        this.userRepository = userRepository;
    }

    @PostMapping("/sos")
    public ResponseEntity<SosResponseDto> triggerSos(@RequestBody SosRequestDto request, Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + authentication.getName()));
        return ResponseEntity.ok(safetyService.triggerSos(user, request));
    }

    @GetMapping("/events")
    public ResponseEntity<List<EmergencyEventDto>> getUserSafetyEvents(Authentication authentication) {
        return ResponseEntity.ok(safetyService.getUserEvents(authentication.getName()));
    }

    @PostMapping("/events/{id}/resolve")
    public ResponseEntity<EmergencyEventDto> resolveEvent(@PathVariable UUID id, Authentication authentication) {
        return ResponseEntity.ok(safetyService.resolveEvent(id, authentication.getName()));
    }
}
