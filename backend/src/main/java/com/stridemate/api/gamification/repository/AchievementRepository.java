package com.stridemate.api.gamification.repository;

import com.stridemate.api.gamification.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, String> {
    List<Achievement> findAllByOrderByRewardXpAsc();
}
