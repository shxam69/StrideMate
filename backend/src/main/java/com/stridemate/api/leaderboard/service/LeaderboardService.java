package com.stridemate.api.leaderboard.service;

import com.stridemate.api.activity.repository.ActivityRepository;
import com.stridemate.api.activity.repository.UserPointsProjection;
import com.stridemate.api.leaderboard.dto.LeaderboardEntryDto;
import com.stridemate.api.leaderboard.dto.Trend;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
        return mapLeaderboard(currentRanking, previousRanking);
    }

    public List<LeaderboardEntryDto> getWeeklyLeaderboard() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Instant since = monday.atStartOfDay().toInstant(ZoneOffset.UTC);

        List<UserPointsProjection> currentRanking = activityRepository.getLeaderboardSince(since);

        // Previous 24h cutoff for trend comparison
        Instant prevCutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        List<UserPointsProjection> previousRanking = prevCutoff.isAfter(since)
                ? activityRepository.getLeaderboardBetween(since, prevCutoff)
                : new ArrayList<>();

        return mapLeaderboard(currentRanking, previousRanking);
    }

    public List<LeaderboardEntryDto> getMonthlyLeaderboard() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate firstOfMonth = today.withDayOfMonth(1);
        Instant since = firstOfMonth.atStartOfDay().toInstant(ZoneOffset.UTC);

        List<UserPointsProjection> currentRanking = activityRepository.getLeaderboardSince(since);

        Instant prevCutoff = Instant.now().minus(24, ChronoUnit.HOURS);
        List<UserPointsProjection> previousRanking = prevCutoff.isAfter(since)
                ? activityRepository.getLeaderboardBetween(since, prevCutoff)
                : new ArrayList<>();

        return mapLeaderboard(currentRanking, previousRanking);
    }

    private List<LeaderboardEntryDto> mapLeaderboard(List<UserPointsProjection> currentRanking, List<UserPointsProjection> previousRanking) {
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
                entry.setTrend(Trend.UP);
            }

            leaderboard.add(entry);
            currentRank++;
        }

        return leaderboard;
    }
}
