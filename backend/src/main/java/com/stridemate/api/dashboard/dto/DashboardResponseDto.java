package com.stridemate.api.dashboard.dto;

import com.stridemate.api.user.dto.UserDto;
import java.util.List;

public class DashboardResponseDto {
    private UserDto user;
    private DashboardSummaryDto summary;
    private DashboardStreakDto streaks;
    private List<ActivityHistoryDto> activityHistory;
    private List<VolumeOverTimeDto> volumeOverTime;
    private List<SportBreakdownDto> sportBreakdown;

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public DashboardSummaryDto getSummary() { return summary; }
    public void setSummary(DashboardSummaryDto summary) { this.summary = summary; }

    public DashboardStreakDto getStreaks() { return streaks; }
    public void setStreaks(DashboardStreakDto streaks) { this.streaks = streaks; }

    public List<ActivityHistoryDto> getActivityHistory() { return activityHistory; }
    public void setActivityHistory(List<ActivityHistoryDto> activityHistory) { this.activityHistory = activityHistory; }

    public List<VolumeOverTimeDto> getVolumeOverTime() { return volumeOverTime; }
    public void setVolumeOverTime(List<VolumeOverTimeDto> volumeOverTime) { this.volumeOverTime = volumeOverTime; }

    public List<SportBreakdownDto> getSportBreakdown() { return sportBreakdown; }
    public void setSportBreakdown(List<SportBreakdownDto> sportBreakdown) { this.sportBreakdown = sportBreakdown; }
}
