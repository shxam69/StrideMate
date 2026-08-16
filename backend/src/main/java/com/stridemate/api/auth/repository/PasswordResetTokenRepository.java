package com.stridemate.api.auth.repository;

import com.stridemate.api.auth.entity.PasswordResetToken;
import com.stridemate.api.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {
    Optional<PasswordResetToken> findByTokenHash(String tokenHash);
    long countByUserAndCreatedAtAfter(User user, java.time.Instant startOfDay);
}
