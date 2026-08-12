package com.stridemate.api.auth.repository;

import com.stridemate.api.auth.entity.OtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, UUID> {
    Optional<OtpEntity> findTopByPhoneNumberOrderByCreatedAtDesc(String phoneNumber);
}
