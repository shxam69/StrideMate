package com.stridemate.api.dashboard.dto;

public class DashboardSummaryDto {
    private long totalPoints;
    private long totalActivities;
    private int currentRank;

    public long getTotalPoints() { return totalPoints; }
    public void setTotalPoints(long totalPoints) { this.totalPoints = totalPoints; }

    public long getTotalActivities() { return totalActivities; }
    public void setTotalActivities(long totalActivities) { this.totalActivities = totalActivities; }

    public int getCurrentRank() { return currentRank; }
    public void setCurrentRank(int currentRank) { this.currentRank = currentRank; }
}
