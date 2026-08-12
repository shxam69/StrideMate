package com.stridemate.api.leaderboard.dto;

import java.util.UUID;

public class LeaderboardEntryDto {
    private int rank;
    private UUID userId;
    private String firstName;
    private String lastName;
    private long totalPoints;
    private Trend trend;

    public LeaderboardEntryDto() {}

    public LeaderboardEntryDto(int rank, UUID userId, String firstName, String lastName, long totalPoints, Trend trend) {
        this.rank = rank;
        this.userId = userId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.totalPoints = totalPoints;
        this.trend = trend;
    }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public long getTotalPoints() { return totalPoints; }
    public void setTotalPoints(long totalPoints) { this.totalPoints = totalPoints; }

    public Trend getTrend() { return trend; }
    public void setTrend(Trend trend) { this.trend = trend; }
}
