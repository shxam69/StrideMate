package com.stridemate.api.gamification.repository;

import com.stridemate.api.gamification.entity.DailyQuest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DailyQuestRepository extends JpaRepository<DailyQuest, UUID> {
    List<DailyQuest> findByUserIdAndQuestDate(UUID userId, LocalDate questDate);
    List<DailyQuest> findByUserIdAndQuestDateOrderByCreatedAtAsc(UUID userId, LocalDate questDate);
}
