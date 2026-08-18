package com.stridemate.api.gamification.dto;

import com.stridemate.api.activity.dto.ActivityResponse;
import java.util.List;

public class ActivitySaveResultDto {
    private ActivityResponse activity;
    private int pointsEarned;
    private int xpEarned;
    private int currentXp;
    private int nextLevelXp;
    private int totalXp;
    private int level;
    private boolean levelUp;
    private int previousLevel;
    private int currentStreak;
    private int longestStreak;
    private boolean isStreakMaintained;
    private List<DailyQuestDto> completedQuests;
    private List<AchievementDto> unlockedAchievements;

    public ActivityResponse getActivity() {
        return activity;
    }

    public void setActivity(ActivityResponse activity) {
        this.activity = activity;
    }

    public int getPointsEarned() {
        return pointsEarned;
    }

    public void setPointsEarned(int pointsEarned) {
        this.pointsEarned = pointsEarned;
    }

    public int getXpEarned() {
        return xpEarned;
    }

    public void setXpEarned(int xpEarned) {
        this.xpEarned = xpEarned;
    }

    public int getCurrentXp() {
        return currentXp;
    }

    public void setCurrentXp(int currentXp) {
        this.currentXp = currentXp;
    }

    public int getNextLevelXp() {
        return nextLevelXp;
    }

    public void setNextLevelXp(int nextLevelXp) {
        this.nextLevelXp = nextLevelXp;
    }

    public int getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(int totalXp) {
        this.totalXp = totalXp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public boolean isLevelUp() {
        return levelUp;
    }

    public void setLevelUp(boolean levelUp) {
        this.levelUp = levelUp;
    }

    public int getPreviousLevel() {
        return previousLevel;
    }

    public void setPreviousLevel(int previousLevel) {
        this.previousLevel = previousLevel;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public boolean isStreakMaintained() {
        return isStreakMaintained;
    }

    public void setStreakMaintained(boolean streakMaintained) {
        isStreakMaintained = streakMaintained;
    }

    public List<DailyQuestDto> getCompletedQuests() {
        return completedQuests;
    }

    public void setCompletedQuests(List<DailyQuestDto> completedQuests) {
        this.completedQuests = completedQuests;
    }

    public List<AchievementDto> getUnlockedAchievements() {
        return unlockedAchievements;
    }

    public void setUnlockedAchievements(List<AchievementDto> unlockedAchievements) {
        this.unlockedAchievements = unlockedAchievements;
    }

    // Delegate getters for backward compatibility with existing tests and clients
    public java.util.UUID getActivityId() {
        return activity != null ? activity.getActivityId() : null;
    }

    public java.util.UUID getUserId() {
        return activity != null ? activity.getUserId() : null;
    }

    public Integer getPoints() {
        return pointsEarned;
    }

    public Integer getCalories() {
        return activity != null ? activity.getCalories() : null;
    }

    public com.stridemate.api.activity.entity.SportType getSport() {
        return activity != null ? activity.getSport() : null;
    }
}
