package com.stridemate.api.user.controller;

import com.stridemate.api.user.dto.EmergencyContactDto;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.service.EmergencyContactService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/emergency-contacts")
public class EmergencyContactController {

    private final EmergencyContactService emergencyContactService;

    @Autowired
    public EmergencyContactController(EmergencyContactService emergencyContactService) {
        this.emergencyContactService = emergencyContactService;
    }

    @GetMapping
    public ResponseEntity<List<EmergencyContactDto>> getEmergencyContacts(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(emergencyContactService.getContacts(email));
    }

    @PostMapping
    public ResponseEntity<EmergencyContactDto> createEmergencyContact(
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        EmergencyContactDto created = emergencyContactService.createContact(email, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmergencyContactDto> updateEmergencyContact(
            @PathVariable UUID id,
            @Valid @RequestBody EmergencyContactRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        EmergencyContactDto updated = emergencyContactService.updateContact(email, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmergencyContact(
            @PathVariable UUID id,
            Authentication authentication) {
        String email = authentication.getName();
        emergencyContactService.deleteContact(email, id);
        return ResponseEntity.noContent().build();
    }
}
