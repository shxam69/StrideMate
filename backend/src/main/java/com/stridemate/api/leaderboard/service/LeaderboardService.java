package com.stridemate.api.leaderboard.service;

import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.UserPointsProjection;
import com.stridemate.api.leaderboard.dto.LeaderboardEntryDto;
import com.stridemate.api.leaderboard.dto.Trend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

@Service
public class LeaderboardService {

    private final ActivityRepository activityRepository;

    @Autowired
    public LeaderboardService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public List<LeaderboardEntryDto> getGlobalLeaderboard() {
        List<UserPointsProjection> currentRanking = activityRepository.getGlobalLeaderboard();
        
        Instant cutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        List<UserPointsProjection> previousRanking = activityRepository.getLeaderboardBefore(cutoff);

        Map<UUID, Integer> previousRanks = new HashMap<>();
        int rank = 1;
        for (UserPointsProjection proj : previousRanking) {
            previousRanks.put(proj.getUserId(), rank++);
        }

        List<LeaderboardEntryDto> leaderboard = new ArrayList<>();
        int currentRank = 1;
        for (UserPointsProjection proj : currentRanking) {
            LeaderboardEntryDto entry = new LeaderboardEntryDto();
            entry.setRank(currentRank);
            entry.setUserId(proj.getUserId());
            entry.setFirstName(proj.getFirstName());
            entry.setLastName(proj.getLastName());
            entry.setTotalPoints(proj.getTotalPoints() != null ? proj.getTotalPoints() : 0);

            if (previousRanks.containsKey(proj.getUserId())) {
                int prevRank = previousRanks.get(proj.getUserId());
                if (prevRank > currentRank) {
                    entry.setTrend(Trend.UP);
                } else if (prevRank < currentRank) {
                    entry.setTrend(Trend.DOWN);
                } else {
                    entry.setTrend(Trend.FLAT);
                }
            } else {
                // If they weren't in the previous ranking, they are essentially trending UP from unranked
                entry.setTrend(Trend.UP);
            }

            leaderboard.add(entry);
            currentRank++;
        }

        return leaderboard;
    }
}
