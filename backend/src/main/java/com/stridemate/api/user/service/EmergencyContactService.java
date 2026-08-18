package com.stridemate.api.user.service;

import com.stridemate.api.exception.ResourceNotFoundException;
import com.stridemate.api.user.dto.EmergencyContactDto;
import com.stridemate.api.user.dto.EmergencyContactRequest;
import com.stridemate.api.user.entity.EmergencyContact;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.EmergencyContactRepository;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmergencyContactService {

    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;

    @Autowired
    public EmergencyContactService(EmergencyContactRepository emergencyContactRepository, UserRepository userRepository) {
        this.emergencyContactRepository = emergencyContactRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<EmergencyContactDto> getContacts(String email) {
        User user = getUser(email);
        return emergencyContactRepository.findByUserOrderByIsPrimaryDescCreatedAtAsc(user)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmergencyContactDto createContact(String email, EmergencyContactRequest request) {
        User user = getUser(email);
        long count = emergencyContactRepository.countByUser(user);

        boolean isPrimary = request.isPrimary() || count == 0;

        if (isPrimary && count > 0) {
            clearPrimaryFlag(user);
        }

        EmergencyContact contact = new EmergencyContact(
                user,
                request.getName().trim(),
                request.getRelationship().trim(),
                request.getPhoneNumber().trim(),
                isPrimary
        );

        EmergencyContact saved = emergencyContactRepository.save(contact);
        return toDto(saved);
    }

    @Transactional
    public EmergencyContactDto updateContact(String email, UUID contactId, EmergencyContactRequest request) {
        User user = getUser(email);
        EmergencyContact contact = emergencyContactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found with id: " + contactId));

        if (request.isPrimary() && !contact.isPrimary()) {
            clearPrimaryFlag(user);
            contact.setPrimary(true);
        } else if (!request.isPrimary() && contact.isPrimary()) {
            contact.setPrimary(false);
        }

        contact.setName(request.getName().trim());
        contact.setRelationship(request.getRelationship().trim());
        contact.setPhoneNumber(request.getPhoneNumber().trim());

        EmergencyContact saved = emergencyContactRepository.save(contact);
        return toDto(saved);
    }

    @Transactional
    public void deleteContact(String email, UUID contactId) {
        User user = getUser(email);
        EmergencyContact contact = emergencyContactRepository.findByIdAndUser(contactId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found with id: " + contactId));

        boolean wasPrimary = contact.isPrimary();
        emergencyContactRepository.delete(contact);

        if (wasPrimary) {
            List<EmergencyContact> remaining = emergencyContactRepository.findByUserOrderByIsPrimaryDescCreatedAtAsc(user);
            if (!remaining.isEmpty()) {
                EmergencyContact first = remaining.get(0);
                first.setPrimary(true);
                emergencyContactRepository.save(first);
            }
        }
    }

    private void clearPrimaryFlag(User user) {
        List<EmergencyContact> primaries = emergencyContactRepository.findByUserAndIsPrimaryTrue(user);
        for (EmergencyContact p : primaries) {
            p.setPrimary(false);
            emergencyContactRepository.save(p);
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    public EmergencyContactDto toDto(EmergencyContact contact) {
        return new EmergencyContactDto(
                contact.getId(),
                contact.getName(),
                contact.getRelationship(),
                contact.getPhoneNumber(),
                contact.isPrimary(),
                contact.getCreatedAt(),
                contact.getUpdatedAt()
        );
    }
}
