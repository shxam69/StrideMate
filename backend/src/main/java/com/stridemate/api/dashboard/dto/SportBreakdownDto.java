package com.stridemate.api.dashboard.dto;

import com.stridemate.api.activity.entity.SportType;

public class SportBreakdownDto {
    private SportType sport;
    private long activityCount;
    private long points;

    public SportBreakdownDto(SportType sport, long activityCount, long points) {
        this.sport = sport;
        this.activityCount = activityCount;
        this.points = points;
    }

    public SportType getSport() { return sport; }
    public void setSport(SportType sport) { this.sport = sport; }

    public long getActivityCount() { return activityCount; }
    public void setActivityCount(long activityCount) { this.activityCount = activityCount; }

    public long getPoints() { return points; }
    public void setPoints(long points) { this.points = points; }
}
