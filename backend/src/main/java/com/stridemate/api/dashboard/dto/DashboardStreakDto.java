package com.stridemate.api.dashboard.dto;

public class DashboardStreakDto {
    private int currentStreak;
    private int longestStreak;
    private boolean activeToday;
    private String lastActivityDate;

    public DashboardStreakDto() {}

    public DashboardStreakDto(int currentStreak, int longestStreak, boolean activeToday, String lastActivityDate) {
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.activeToday = activeToday;
        this.lastActivityDate = lastActivityDate;
    }

    public int getCurrentStreak() { return currentStreak; }
    public void setCurrentStreak(int currentStreak) { this.currentStreak = currentStreak; }

    public int getLongestStreak() { return longestStreak; }
    public void setLongestStreak(int longestStreak) { this.longestStreak = longestStreak; }

    public boolean isActiveToday() { return activeToday; }
    public void setActiveToday(boolean activeToday) { this.activeToday = activeToday; }

    public String getLastActivityDate() { return lastActivityDate; }
    public void setLastActivityDate(String lastActivityDate) { this.lastActivityDate = lastActivityDate; }
}
