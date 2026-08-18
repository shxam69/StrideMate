package com.stridemate.api.gamification.repository;

import com.stridemate.api.gamification.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, UUID> {
    List<UserAchievement> findByUserId(UUID userId);
    Optional<UserAchievement> findByUserIdAndAchievementCode(UUID userId, String achievementCode);
    boolean existsByUserIdAndAchievementCode(UUID userId, String achievementCode);
}
