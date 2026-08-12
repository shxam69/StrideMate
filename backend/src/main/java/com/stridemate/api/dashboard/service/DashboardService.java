package com.stridemate.api.dashboard.service;

import com.stridemate.api.activity.entity.Activity;
import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.SportBreakdownProjection;
import com.stridemate.api.activity.repository.UserPointsProjection;
import com.stridemate.api.activity.repository.VolumeProjection;
import com.stridemate.api.user.dto.UserDto;
import com.stridemate.api.dashboard.dto.*;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Autowired
    public DashboardService(ActivityRepository activityRepository, UserRepository userRepository) {
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    public DashboardResponseDto getDashboardForUser(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        DashboardResponseDto response = new DashboardResponseDto();
        
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setEmail(user.getEmail());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        response.setUser(userDto);

        Long totalPoints = activityRepository.getTotalPointsByUserId(user.getId());
        Long totalActivities = activityRepository.countActivitiesByUserId(user.getId());
        
        DashboardSummaryDto summary = new DashboardSummaryDto();
        summary.setTotalPoints(totalPoints != null ? totalPoints : 0);
        summary.setTotalActivities(totalActivities != null ? totalActivities : 0);
        
        // Calculate global rank
        List<UserPointsProjection> leaderboard = activityRepository.getGlobalLeaderboard();
        int currentRank = 0; // 0 means unranked
        int rank = 1;
        for (UserPointsProjection proj : leaderboard) {
            if (proj.getUserId().equals(user.getId())) {
                currentRank = rank;
                break;
            }
            rank++;
        }
        summary.setCurrentRank(currentRank);
        response.setSummary(summary);

        List<Activity> history = activityRepository.findByUserIdOrderByRecordedAtDesc(user.getId());
        List<ActivityHistoryDto> historyDtos = history.stream().map(this::toHistoryDto).collect(Collectors.toList());
        response.setActivityHistory(historyDtos);

        List<VolumeProjection> volumeProjections = activityRepository.getVolumeOverTime(user.getId());
        List<VolumeOverTimeDto> volumeDtos = volumeProjections.stream()
                .map(p -> new VolumeOverTimeDto(p.getDateStr(), p.getPoints() != null ? p.getPoints() : 0, p.getActivityCount() != null ? p.getActivityCount() : 0))
                .collect(Collectors.toList());
        response.setVolumeOverTime(volumeDtos);

        List<SportBreakdownProjection> breakdownProjections = activityRepository.getSportBreakdown(user.getId());
        List<SportBreakdownDto> breakdownDtos = breakdownProjections.stream()
                .map(p -> new SportBreakdownDto(p.getSport(), p.getActivityCount() != null ? p.getActivityCount() : 0, p.getPoints() != null ? p.getPoints() : 0))
                .collect(Collectors.toList());
        response.setSportBreakdown(breakdownDtos);

        return response;
    }

    private ActivityHistoryDto toHistoryDto(Activity activity) {
        ActivityHistoryDto dto = new ActivityHistoryDto();
        dto.setActivityId(activity.getId());
        dto.setSport(activity.getSport());
        dto.setDistanceKm(activity.getDistanceKm());
        dto.setDurationMinutes(activity.getDurationMinutes());
        dto.setDurationSeconds(activity.getDurationSeconds());
        dto.setSteps(activity.getSteps());
        dto.setPoints(activity.getPoints());
        dto.setRecordedAt(activity.getRecordedAt());
        return dto;
    }
}
