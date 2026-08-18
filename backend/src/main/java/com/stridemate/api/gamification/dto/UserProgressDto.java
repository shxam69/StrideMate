package com.stridemate.api.gamification.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class UserProgressDto {
    private UUID userId;
    private int level;
    private int xp;
    private int nextLevelXp;
    private int totalXp;
    private int currentStreak;
    private int longestStreak;
    private LocalDate lastActivityDate;
    private List<Boolean> last7DaysActive; // Sunday to Saturday or past 7 days boolean flags
    private int dailyEnergy; // 0-100% motivational score based on streak & daily activity

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getXp() {
        return xp;
    }

    public void setXp(int xp) {
        this.xp = xp;
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

    public LocalDate getLastActivityDate() {
        return lastActivityDate;
    }

    public void setLastActivityDate(LocalDate lastActivityDate) {
        this.lastActivityDate = lastActivityDate;
    }

    public List<Boolean> getLast7DaysActive() {
        return last7DaysActive;
    }

    public void setLast7DaysActive(List<Boolean> last7DaysActive) {
        this.last7DaysActive = last7DaysActive;
    }

    public int getDailyEnergy() {
        return dailyEnergy;
    }

    public void setDailyEnergy(int dailyEnergy) {
        this.dailyEnergy = dailyEnergy;
    }
}
