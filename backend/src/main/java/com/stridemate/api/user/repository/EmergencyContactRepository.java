package com.stridemate.api.user.repository;

import com.stridemate.api.user.entity.EmergencyContact;
import com.stridemate.api.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, UUID> {
    List<EmergencyContact> findByUserOrderByIsPrimaryDescCreatedAtAsc(User user);
    Optional<EmergencyContact> findByIdAndUser(UUID id, User user);
    long countByUser(User user);
    boolean existsByUser(User user);
    List<EmergencyContact> findByUserAndIsPrimaryTrue(User user);
}
