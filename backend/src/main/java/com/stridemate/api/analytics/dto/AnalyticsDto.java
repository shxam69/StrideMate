package com.stridemate.api.analytics.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AnalyticsDto {
    private long totalActivities;
    private BigDecimal totalDistanceKm;
    private long totalDurationSeconds;
    private long totalCalories;
    private long totalPoints;

    // Weekly metrics (last 7 days)
    private long weeklyActivityCount;
    private BigDecimal weeklyDistanceKm;
    private long weeklyCalories;
    private long weeklyPoints;

    // Streaks
    private int currentStreak;
    private int longestStreak;

    // 7-day daily activity chart
    private List<DailyVolumeDto> dailyVolumeLast7Days;

    // Sport distribution breakdown
    private Map<String, Long> sportDistributionCount;
    private Map<String, Long> sportDistributionPoints;

    public static class DailyVolumeDto {
        private String date; // e.g. "2026-08-18"
        private String dayOfWeek; // e.g. "Tue"
        private long points;
        private long calories;
        private BigDecimal distanceKm;
        private int activityCount;

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public String getDayOfWeek() {
            return dayOfWeek;
        }

        public void setDayOfWeek(String dayOfWeek) {
            this.dayOfWeek = dayOfWeek;
        }

        public long getPoints() {
            return points;
        }

        public void setPoints(long points) {
            this.points = points;
        }

        public long getCalories() {
            return calories;
        }

        public void setCalories(long calories) {
            this.calories = calories;
        }

        public BigDecimal getDistanceKm() {
            return distanceKm;
        }

        public void setDistanceKm(BigDecimal distanceKm) {
            this.distanceKm = distanceKm;
        }

        public int getActivityCount() {
            return activityCount;
        }

        public void setActivityCount(int activityCount) {
            this.activityCount = activityCount;
        }
    }

    public long getTotalActivities() {
        return totalActivities;
    }

    public void setTotalActivities(long totalActivities) {
        this.totalActivities = totalActivities;
    }

    public BigDecimal getTotalDistanceKm() {
        return totalDistanceKm;
    }

    public void setTotalDistanceKm(BigDecimal totalDistanceKm) {
        this.totalDistanceKm = totalDistanceKm;
    }

    public long getTotalDurationSeconds() {
        return totalDurationSeconds;
    }

    public void setTotalDurationSeconds(long totalDurationSeconds) {
        this.totalDurationSeconds = totalDurationSeconds;
    }

    public long getTotalCalories() {
        return totalCalories;
    }

    public void setTotalCalories(long totalCalories) {
        this.totalCalories = totalCalories;
    }

    public long getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(long totalPoints) {
        this.totalPoints = totalPoints;
    }

    public long getWeeklyActivityCount() {
        return weeklyActivityCount;
    }

    public void setWeeklyActivityCount(long weeklyActivityCount) {
        this.weeklyActivityCount = weeklyActivityCount;
    }

    public BigDecimal getWeeklyDistanceKm() {
        return weeklyDistanceKm;
    }

    public void setWeeklyDistanceKm(BigDecimal weeklyDistanceKm) {
        this.weeklyDistanceKm = weeklyDistanceKm;
    }

    public long getWeeklyCalories() {
        return weeklyCalories;
    }

    public void setWeeklyCalories(long weeklyCalories) {
        this.weeklyCalories = weeklyCalories;
    }

    public long getWeeklyPoints() {
        return weeklyPoints;
    }

    public void setWeeklyPoints(long weeklyPoints) {
        this.weeklyPoints = weeklyPoints;
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

    public List<DailyVolumeDto> getDailyVolumeLast7Days() {
        return dailyVolumeLast7Days;
    }

    public void setDailyVolumeLast7Days(List<DailyVolumeDto> dailyVolumeLast7Days) {
        this.dailyVolumeLast7Days = dailyVolumeLast7Days;
    }

    public Map<String, Long> getSportDistributionCount() {
        return sportDistributionCount;
    }

    public void setSportDistributionCount(Map<String, Long> sportDistributionCount) {
        this.sportDistributionCount = sportDistributionCount;
    }

    public Map<String, Long> getSportDistributionPoints() {
        return sportDistributionPoints;
    }

    public void setSportDistributionPoints(Map<String, Long> sportDistributionPoints) {
        this.sportDistributionPoints = sportDistributionPoints;
    }
}
