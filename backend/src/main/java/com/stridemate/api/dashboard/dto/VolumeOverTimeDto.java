package com.stridemate.api.dashboard.dto;

public class VolumeOverTimeDto {
    private String date; // YYYY-MM-DD
    private long points;
    private long activityCount;

    public VolumeOverTimeDto(String date, long points, long activityCount) {
        this.date = date;
        this.points = points;
        this.activityCount = activityCount;
    }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public long getPoints() { return points; }
    public void setPoints(long points) { this.points = points; }

    public long getActivityCount() { return activityCount; }
    public void setActivityCount(long activityCount) { this.activityCount = activityCount; }
}
