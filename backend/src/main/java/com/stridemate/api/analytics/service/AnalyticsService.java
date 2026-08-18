package com.stridemate.api.analytics.service;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.SportBreakdownProjection;
import com.stridemate.api.analytics.dto.AnalyticsDto;
import com.stridemate.api.gamification.entity.UserProgress;
import com.stridemate.api.gamification.service.GamificationService;
import com.stridemate.api.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AnalyticsService {

    private final ActivityRepository activityRepository;
    private final GamificationService gamificationService;

    @Autowired
    public AnalyticsService(ActivityRepository activityRepository, GamificationService gamificationService) {
        this.activityRepository = activityRepository;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public AnalyticsDto getUserAnalytics(User user) {
        UUID userId = user.getId();
        AnalyticsDto dto = new AnalyticsDto();

        // 1. Overall Lifetime Aggregates
        Long totalActivities = activityRepository.countActivitiesByUserId(userId);
        Long totalPoints = activityRepository.getTotalPointsByUserId(userId);
        BigDecimal totalDistance = activityRepository.getTotalDistanceByUserId(userId);
        Long totalDuration = activityRepository.getTotalDurationSecondsByUserId(userId);
        Long totalCalories = activityRepository.getTotalCaloriesByUserId(userId);

        dto.setTotalActivities(totalActivities != null ? totalActivities : 0L);
        dto.setTotalPoints(totalPoints != null ? totalPoints : 0L);
        dto.setTotalDistanceKm(totalDistance != null ? totalDistance : BigDecimal.ZERO);
        dto.setTotalDurationSeconds(totalDuration != null ? totalDuration : 0L);
        dto.setTotalCalories(totalCalories != null ? totalCalories : 0L);

        // 2. Streaks from Gamification
        UserProgress progress = gamificationService.getOrCreateUserProgress(user);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        int currentStreak = progress.getCurrentStreak();
        if (progress.getLastActivityDate() != null && progress.getLastActivityDate().isBefore(today.minusDays(1))) {
            currentStreak = 0;
        }
        dto.setCurrentStreak(currentStreak);
        dto.setLongestStreak(progress.getLongestStreak());

        // 3. Weekly Aggregates & 7-Day Chart
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<Activity> recentActivities = activityRepository.findByUserIdAndRecordedAtAfter(userId, sevenDaysAgo);

        long weeklyCount = 0;
        BigDecimal weeklyDistance = BigDecimal.ZERO;
        long weeklyCalories = 0;
        long weeklyPoints = 0;

        // Group by day for the 7-day visualization
        Map<LocalDate, AnalyticsDto.DailyVolumeDto> dayMap = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            AnalyticsDto.DailyVolumeDto dDto = new AnalyticsDto.DailyVolumeDto();
            dDto.setDate(date.toString());
            dDto.setDayOfWeek(date.getDayOfWeek().toString().substring(0, 3));
            dDto.setPoints(0);
            dDto.setCalories(0);
            dDto.setDistanceKm(BigDecimal.ZERO);
            dDto.setActivityCount(0);
            dayMap.put(date, dDto);
        }

        for (Activity a : recentActivities) {
            weeklyCount++;
            if (a.getDistanceKm() != null) {
                weeklyDistance = weeklyDistance.add(a.getDistanceKm());
            }
            if (a.getCalories() != null) {
                weeklyCalories += a.getCalories();
            }
            weeklyPoints += a.getPoints();

            LocalDate actDate = a.getRecordedAt().atZone(ZoneOffset.UTC).toLocalDate();
            if (dayMap.containsKey(actDate)) {
                AnalyticsDto.DailyVolumeDto dDto = dayMap.get(actDate);
                dDto.setPoints(dDto.getPoints() + a.getPoints());
                dDto.setCalories(dDto.getCalories() + (a.getCalories() != null ? a.getCalories() : 0));
                if (a.getDistanceKm() != null) {
                    dDto.setDistanceKm(dDto.getDistanceKm().add(a.getDistanceKm()));
                }
                dDto.setActivityCount(dDto.getActivityCount() + 1);
            }
        }

        dto.setWeeklyActivityCount(weeklyCount);
        dto.setWeeklyDistanceKm(weeklyDistance);
        dto.setWeeklyCalories(weeklyCalories);
        dto.setWeeklyPoints(weeklyPoints);
        dto.setDailyVolumeLast7Days(new ArrayList<>(dayMap.values()));

        // 4. Sport Distribution
        List<SportBreakdownProjection> breakdown = activityRepository.getSportBreakdown(userId);
        Map<String, Long> sportCount = new HashMap<>();
        Map<String, Long> sportPoints = new HashMap<>();
        for (SportBreakdownProjection s : breakdown) {
            String sportName = s.getSport().name();
            sportCount.put(sportName, s.getActivityCount());
            sportPoints.put(sportName, s.getPoints() != null ? s.getPoints() : 0L);
        }
        dto.setSportDistributionCount(sportCount);
        dto.setSportDistributionPoints(sportPoints);

        return dto;
    }
}
