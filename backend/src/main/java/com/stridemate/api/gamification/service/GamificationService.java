package com.stridemate.api.gamification.service;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.entity.SportType;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.gamification.dto.AchievementDto;
import com.stridemate.api.gamification.dto.DailyQuestDto;
import com.stridemate.api.gamification.dto.UserProgressDto;
import com.stridemate.api.gamification.entity.*;
import com.stridemate.api.gamification.repository.AchievementRepository;
import com.stridemate.api.gamification.repository.DailyQuestRepository;
import com.stridemate.api.gamification.repository.UserAchievementRepository;
import com.stridemate.api.gamification.repository.UserProgressRepository;
import com.stridemate.api.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GamificationService {

    private final UserProgressRepository userProgressRepository;
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final DailyQuestRepository dailyQuestRepository;
    private final ActivityRepository activityRepository;

    @Autowired
    public GamificationService(
            UserProgressRepository userProgressRepository,
            AchievementRepository achievementRepository,
            UserAchievementRepository userAchievementRepository,
            DailyQuestRepository dailyQuestRepository,
            ActivityRepository activityRepository) {
        this.userProgressRepository = userProgressRepository;
        this.achievementRepository = achievementRepository;
        this.userAchievementRepository = userAchievementRepository;
        this.dailyQuestRepository = dailyQuestRepository;
        this.activityRepository = activityRepository;
    }

    // =========================================================================
    // 1. DETERMINISTIC LEVEL PROGRESSION CURVE
    // =========================================================================
    /**
     * Level thresholds:
     * Level 1: 0 XP
     * Level 2: 100 XP
     * Level 3: 250 XP (+150)
     * Level 4: 450 XP (+200)
     * Level 5: 700 XP (+250)
     * Level N threshold: 25 * (N - 1) * (N + 2) or piecewise deterministic
     */
    public static int getCumulativeXpForLevel(int level) {
        if (level <= 1) return 0;
        int total = 0;
        for (int i = 1; i < level; i++) {
            total += 50 + (i * 50); // Level 1->2: 100, 2->3: 150, 3->4: 200, 4->5: 250
        }
        return total;
    }

    public static int getXpRequiredForNextLevel(int currentLevel) {
        return 50 + (currentLevel * 50);
    }

    public static int calculateLevel(int totalXp) {
        int lvl = 1;
        while (totalXp >= getCumulativeXpForLevel(lvl + 1)) {
            lvl++;
        }
        return lvl;
    }

    public static int calculateCurrentLevelXp(int totalXp, int level) {
        int prevLevelBase = getCumulativeXpForLevel(level);
        return Math.max(0, totalXp - prevLevelBase);
    }

    // =========================================================================
    // 2. USER PROGRESS & STREAK RETRIEVAL
    // =========================================================================
    @Transactional
    public UserProgress getOrCreateUserProgress(User user) {
        return userProgressRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserProgress progress = new UserProgress(user);
                    return userProgressRepository.save(progress);
                });
    }

    @Transactional
    public UserProgressDto getUserProgressDto(User user) {
        UserProgress progress = getOrCreateUserProgress(user);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // Check if streak was broken (missed yesterday and today)
        int currentStreak = progress.getCurrentStreak();
        if (progress.getLastActivityDate() != null) {
            if (progress.getLastActivityDate().isBefore(today.minusDays(1))) {
                currentStreak = 0; // Streak broken if no activity yesterday or today
            }
        }

        int level = progress.getLevel();
        int currentXp = progress.getXp();
        int nextLevelXp = getXpRequiredForNextLevel(level);

        UserProgressDto dto = new UserProgressDto();
        dto.setUserId(user.getId());
        dto.setLevel(level);
        dto.setXp(currentXp);
        dto.setNextLevelXp(nextLevelXp);
        dto.setTotalXp(progress.getTotalXp());
        dto.setCurrentStreak(currentStreak);
        dto.setLongestStreak(progress.getLongestStreak());
        dto.setLastActivityDate(progress.getLastActivityDate());

        // 7-day active history dots (last 7 days from today - 6 to today)
        List<Boolean> last7Days = new ArrayList<>();
        List<Instant> recordedTimestamps = activityRepository.findAllRecordedAtByUserId(user.getId());
        Set<LocalDate> activeDates = recordedTimestamps.stream()
                .map(ts -> ts.atZone(ZoneOffset.UTC).toLocalDate())
                .collect(Collectors.toSet());

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            last7Days.add(activeDates.contains(day));
        }
        dto.setLast7DaysActive(last7Days);

        // Daily energy calculation (motivational score 0-100%)
        int energy = 50;
        if (progress.getLastActivityDate() != null && progress.getLastActivityDate().equals(today)) {
            energy = 100;
        } else if (currentStreak > 0) {
            energy = Math.min(90, 60 + (currentStreak * 5));
        }
        dto.setDailyEnergy(energy);

        return dto;
    }

    // =========================================================================
    // 3. DAILY QUESTS
    // =========================================================================
    @Transactional
    public List<DailyQuest> getOrCreateTodayQuests(User user) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<DailyQuest> existing = dailyQuestRepository.findByUserIdAndQuestDateOrderByCreatedAtAsc(user.getId(), today);
        if (!existing.isEmpty()) {
            return existing;
        }

        // Generate 3 standard, healthy daily quests for today
        List<DailyQuest> quests = new ArrayList<>();
        quests.add(new DailyQuest(user, today, QuestType.COMPLETE_ACTIVITY, "Daily Mover", "Complete at least 1 workout or tracking session today", 1, 30));
        quests.add(new DailyQuest(user, today, QuestType.MOVE_TIME, "Active 20", "Record 20 minutes of active movement today", 20, 40));
        quests.add(new DailyQuest(user, today, QuestType.EARN_POINTS, "Points Hunter", "Earn 50 activity points today", 50, 50));

        return dailyQuestRepository.saveAll(quests);
    }

    @Transactional
    public List<DailyQuestDto> getTodayQuestsDto(User user) {
        List<DailyQuest> quests = getOrCreateTodayQuests(user);
        return quests.stream().map(this::toQuestDto).collect(Collectors.toList());
    }

    // =========================================================================
    // 4. ACHIEVEMENTS
    // =========================================================================
    @Transactional
    public List<AchievementDto> getAllAchievementsWithUserStatus(User user) {
        seedDefaultAchievementsIfMissing();

        List<Achievement> allAchievements = achievementRepository.findAllByOrderByRewardXpAsc();
        List<UserAchievement> userUnlocks = userAchievementRepository.findByUserId(user.getId());

        Map<String, Instant> unlockMap = userUnlocks.stream()
                .collect(Collectors.toMap(UserAchievement::getAchievementCode, UserAchievement::getUnlockedAt));

        return allAchievements.stream().map(a -> {
            AchievementDto dto = new AchievementDto();
            dto.setCode(a.getCode());
            dto.setName(a.getName());
            dto.setDescription(a.getDescription());
            dto.setIcon(a.getIcon());
            dto.setRewardXp(a.getRewardXp());
            dto.setRequirementDescription(a.getRequirementDescription());
            dto.setUnlocked(unlockMap.containsKey(a.getCode()));
            dto.setUnlockedAt(unlockMap.get(a.getCode()));
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void seedDefaultAchievementsIfMissing() {
        for (AchievementCode codeEnum : AchievementCode.values()) {
            if (!achievementRepository.existsById(codeEnum.name())) {
                Achievement achievement = new Achievement(
                        codeEnum.name(),
                        codeEnum.getName(),
                        codeEnum.getDescription(),
                        codeEnum.getIcon(),
                        codeEnum.getRewardXp(),
                        codeEnum.getRequirementDescription()
                );
                achievementRepository.save(achievement);
            }
        }
    }

    // =========================================================================
    // 5. ATOMIC GAMIFICATION TRANSACTION PIPELINE (Triggered on Activity Save)
    // =========================================================================
    public static class ProgressionResult {
        public int pointsEarned;
        public int xpEarned;
        public int currentXp;
        public int nextLevelXp;
        public int totalXp;
        public int level;
        public boolean levelUp;
        public int previousLevel;
        public int currentStreak;
        public int longestStreak;
        public boolean isStreakMaintained;
        public List<DailyQuestDto> completedQuests = new ArrayList<>();
        public List<AchievementDto> unlockedAchievements = new ArrayList<>();
    }

    @Transactional
    public ProgressionResult processActivityGamification(User user, Activity savedActivity) {
        seedDefaultAchievementsIfMissing();
        UserProgress progress = getOrCreateUserProgress(user);
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        ProgressionResult result = new ProgressionResult();
        int basePoints = savedActivity.getPoints();
        result.pointsEarned = basePoints;

        int totalXpGained = basePoints; // 1 activity point = 1 XP initially

        // 1. Update Daily Streak
        LocalDate lastDate = progress.getLastActivityDate();
        if (lastDate == null) {
            progress.setCurrentStreak(1);
            progress.setLongestStreak(Math.max(1, progress.getLongestStreak()));
            progress.setLastActivityDate(today);
            result.isStreakMaintained = true;
        } else if (lastDate.equals(today)) {
            // Same day activity: maintain existing streak, do not double increment
            result.isStreakMaintained = true;
        } else if (lastDate.equals(today.minusDays(1))) {
            // Consecutive day: increment streak
            int newStreak = progress.getCurrentStreak() + 1;
            progress.setCurrentStreak(newStreak);
            progress.setLongestStreak(Math.max(newStreak, progress.getLongestStreak()));
            progress.setLastActivityDate(today);
            result.isStreakMaintained = true;
        } else {
            // Missed a day: reset streak to 1
            progress.setCurrentStreak(1);
            progress.setLongestStreak(Math.max(1, progress.getLongestStreak()));
            progress.setLastActivityDate(today);
            result.isStreakMaintained = true;
        }

        // 2. Update Daily Quests
        List<DailyQuest> todayQuests = getOrCreateTodayQuests(user);
        for (DailyQuest quest : todayQuests) {
            if (!quest.isCompleted()) {
                int increment = 0;
                switch (quest.getQuestType()) {
                    case COMPLETE_ACTIVITY:
                        increment = 1;
                        break;
                    case MOVE_TIME:
                        int durMins = savedActivity.getTotalDurationSeconds() != null 
                                ? savedActivity.getTotalDurationSeconds() / 60 
                                : (savedActivity.getDurationMinutes() != null ? savedActivity.getDurationMinutes() : 0);
                        increment = durMins;
                        break;
                    case DISTANCE:
                        if (savedActivity.getDistanceKm() != null) {
                            increment = (int) (savedActivity.getDistanceKm().doubleValue() * 1000); // in meters
                        }
                        break;
                    case EARN_POINTS:
                        increment = savedActivity.getPoints();
                        break;
                }

                quest.setCurrentProgress(quest.getCurrentProgress() + increment);
                if (quest.getCurrentProgress() >= quest.getTargetValue()) {
                    quest.setCompleted(true);
                    quest.setCompletedAt(Instant.now());
                    totalXpGained += quest.getRewardXp(); // Bonus XP
                    result.completedQuests.add(toQuestDto(quest));
                }
            }
        }
        dailyQuestRepository.saveAll(todayQuests);

        // 3. Update User XP & Level Calculation
        int oldTotalXp = progress.getTotalXp();
        int newTotalXp = oldTotalXp + totalXpGained;
        int prevLevel = progress.getLevel();
        int newLevel = calculateLevel(newTotalXp);

        progress.setTotalXp(newTotalXp);
        progress.setLevel(newLevel);
        progress.setXp(calculateCurrentLevelXp(newTotalXp, newLevel));

        // 4. Check & Award Achievements
        List<UserAchievement> newUnlocks = evaluateAchievements(user, savedActivity, progress);
        for (UserAchievement ua : newUnlocks) {
            Achievement ach = achievementRepository.findById(ua.getAchievementCode()).orElse(null);
            if (ach != null) {
                totalXpGained += ach.getRewardXp(); // Bonus XP from achievement
                AchievementDto aDto = new AchievementDto();
                aDto.setCode(ach.getCode());
                aDto.setName(ach.getName());
                aDto.setDescription(ach.getDescription());
                aDto.setIcon(ach.getIcon());
                aDto.setRewardXp(ach.getRewardXp());
                aDto.setRequirementDescription(ach.getRequirementDescription());
                aDto.setUnlocked(true);
                aDto.setUnlockedAt(ua.getUnlockedAt());
                result.unlockedAchievements.add(aDto);
            }
        }

        // Recalculate level if achievement bonuses pushed to higher level
        newTotalXp = oldTotalXp + totalXpGained;
        newLevel = calculateLevel(newTotalXp);
        progress.setTotalXp(newTotalXp);
        progress.setLevel(newLevel);
        progress.setXp(calculateCurrentLevelXp(newTotalXp, newLevel));

        userProgressRepository.save(progress);

        // Populate Result
        result.xpEarned = totalXpGained;
        result.totalXp = progress.getTotalXp();
        result.currentXp = progress.getXp();
        result.nextLevelXp = getXpRequiredForNextLevel(progress.getLevel());
        result.level = progress.getLevel();
        result.previousLevel = prevLevel;
        result.levelUp = newLevel > prevLevel;
        result.currentStreak = progress.getCurrentStreak();
        result.longestStreak = progress.getLongestStreak();

        return result;
    }

    private List<UserAchievement> evaluateAchievements(User user, Activity currentActivity, UserProgress progress) {
        List<UserAchievement> newUnlocks = new ArrayList<>();
        UUID userId = user.getId();

        Long totalActivitiesCount = activityRepository.countActivitiesByUserId(userId);
        BigDecimal totalDistance = activityRepository.getTotalDistanceByUserId(userId);
        BigDecimal totalRunningDistance = activityRepository.getTotalRunningDistanceByUserId(userId);

        double totalDistKm = totalDistance != null ? totalDistance.doubleValue() : 0.0;
        double totalRunKm = totalRunningDistance != null ? totalRunningDistance.doubleValue() : 0.0;
        int currentStreak = progress.getCurrentStreak();
        int totalXp = progress.getTotalXp();

        // 1. FIRST_ACTIVITY
        checkAndAward(userId, user, AchievementCode.FIRST_ACTIVITY.name(), (totalActivitiesCount != null && totalActivitiesCount >= 1), newUnlocks);

        // 2. FIRST_100_XP
        checkAndAward(userId, user, AchievementCode.FIRST_100_XP.name(), (totalXp >= 100), newUnlocks);

        // 3. THREE_DAY_STREAK
        checkAndAward(userId, user, AchievementCode.THREE_DAY_STREAK.name(), (currentStreak >= 3), newUnlocks);

        // 4. SEVEN_DAY_STREAK
        checkAndAward(userId, user, AchievementCode.SEVEN_DAY_STREAK.name(), (currentStreak >= 7), newUnlocks);

        // 5. TEN_KM_TOTAL
        checkAndAward(userId, user, AchievementCode.TEN_KM_TOTAL.name(), (totalDistKm >= 10.0), newUnlocks);

        // 6. ONE_THOUSAND_XP
        checkAndAward(userId, user, AchievementCode.ONE_THOUSAND_XP.name(), (totalXp >= 1000), newUnlocks);

        // 7. THIRTY_DAY_STREAK
        checkAndAward(userId, user, AchievementCode.THIRTY_DAY_STREAK.name(), (currentStreak >= 30), newUnlocks);

        // 8. TEN_KM_RUNNING
        checkAndAward(userId, user, AchievementCode.TEN_KM_RUNNING.name(), (totalRunKm >= 10.0), newUnlocks);

        return newUnlocks;
    }

    private void checkAndAward(UUID userId, User user, String code, boolean conditionMet, List<UserAchievement> newUnlocks) {
        if (conditionMet && !userAchievementRepository.existsByUserIdAndAchievementCode(userId, code)) {
            UserAchievement ua = new UserAchievement(user, code);
            userAchievementRepository.save(ua);
            newUnlocks.add(ua);
        }
    }

    private DailyQuestDto toQuestDto(DailyQuest quest) {
        DailyQuestDto dto = new DailyQuestDto();
        dto.setId(quest.getId());
        dto.setQuestDate(quest.getQuestDate());
        dto.setQuestType(quest.getQuestType());
        dto.setTitle(quest.getTitle());
        dto.setDescription(quest.getDescription());
        dto.setTargetValue(quest.getTargetValue());
        dto.setCurrentProgress(quest.getCurrentProgress());
        dto.setRewardXp(quest.getRewardXp());
        dto.setCompleted(quest.isCompleted());
        return dto;
    }
}
