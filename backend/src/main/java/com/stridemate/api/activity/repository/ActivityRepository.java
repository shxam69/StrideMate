package com.stridemate.api.activity.repository;

import com.stridemate.api.activity.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    // Leaderboard Queries
    @Query("SELECT a.user.id as userId, a.user.firstName as firstName, a.user.lastName as lastName, SUM(a.points) as totalPoints " +
           "FROM Activity a " +
           "GROUP BY a.user.id, a.user.firstName, a.user.lastName " +
           "ORDER BY SUM(a.points) DESC, a.user.id ASC")
    List<UserPointsProjection> getGlobalLeaderboard();

    @Query("SELECT a.user.id as userId, a.user.firstName as firstName, a.user.lastName as lastName, SUM(a.points) as totalPoints " +
           "FROM Activity a " +
           "WHERE a.createdAt < :cutoff " +
           "GROUP BY a.user.id, a.user.firstName, a.user.lastName " +
           "ORDER BY SUM(a.points) DESC, a.user.id ASC")
    List<UserPointsProjection> getLeaderboardBefore(@Param("cutoff") Instant cutoff);

    @Query("SELECT a.user.id as userId, a.user.firstName as firstName, a.user.lastName as lastName, SUM(a.points) as totalPoints " +
           "FROM Activity a " +
           "WHERE a.recordedAt >= :since " +
           "GROUP BY a.user.id, a.user.firstName, a.user.lastName " +
           "ORDER BY SUM(a.points) DESC, a.user.id ASC")
    List<UserPointsProjection> getLeaderboardSince(@Param("since") Instant since);

    @Query("SELECT a.user.id as userId, a.user.firstName as firstName, a.user.lastName as lastName, SUM(a.points) as totalPoints " +
           "FROM Activity a " +
           "WHERE a.recordedAt >= :since AND a.recordedAt < :before " +
           "GROUP BY a.user.id, a.user.firstName, a.user.lastName " +
           "ORDER BY SUM(a.points) DESC, a.user.id ASC")
    List<UserPointsProjection> getLeaderboardBetween(@Param("since") Instant since, @Param("before") Instant before);

    // Dashboard & History Queries
    List<Activity> findByUserIdOrderByRecordedAtDesc(UUID userId);

    Optional<Activity> findByIdAndUserId(UUID id, UUID userId);

    @Query("SELECT SUM(a.points) FROM Activity a WHERE a.user.id = :userId")
    Long getTotalPointsByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(a) FROM Activity a WHERE a.user.id = :userId")
    Long countActivitiesByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(a.distanceKm) FROM Activity a WHERE a.user.id = :userId")
    BigDecimal getTotalDistanceByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(a.totalDurationSeconds) FROM Activity a WHERE a.user.id = :userId")
    Long getTotalDurationSecondsByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(a.calories) FROM Activity a WHERE a.user.id = :userId")
    Long getTotalCaloriesByUserId(@Param("userId") UUID userId);

    @Query("SELECT SUM(a.distanceKm) FROM Activity a WHERE a.user.id = :userId AND a.sport = com.stridemate.api.activity.entity.SportType.RUNNING")
    BigDecimal getTotalRunningDistanceByUserId(@Param("userId") UUID userId);

    @Query("SELECT CAST(a.recordedAt AS date) as dateStr, SUM(a.points) as points, COUNT(a) as activityCount " +
           "FROM Activity a " +
           "WHERE a.user.id = :userId " +
           "GROUP BY CAST(a.recordedAt AS date) " +
           "ORDER BY CAST(a.recordedAt AS date) ASC")
    List<VolumeProjection> getVolumeOverTime(@Param("userId") UUID userId);

    @Query("SELECT a.sport as sport, COUNT(a) as activityCount, SUM(a.points) as points " +
           "FROM Activity a " +
           "WHERE a.user.id = :userId " +
           "GROUP BY a.sport")
    List<SportBreakdownProjection> getSportBreakdown(@Param("userId") UUID userId);

    @Query("SELECT a.recordedAt FROM Activity a WHERE a.user.id = :userId ORDER BY a.recordedAt DESC")
    List<Instant> findAllRecordedAtByUserId(@Param("userId") UUID userId);

    @Query("SELECT a FROM Activity a WHERE a.user.id = :userId AND a.recordedAt >= :since ORDER BY a.recordedAt ASC")
    List<Activity> findByUserIdAndRecordedAtAfter(@Param("userId") UUID userId, @Param("since") Instant since);
}
