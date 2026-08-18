package com.stridemate.api.leaderboard.controller;

import com.stridemate.api.leaderboard.dto.LeaderboardEntryDto;
import com.stridemate.api.leaderboard.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Autowired
    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public List<LeaderboardEntryDto> getGlobalLeaderboard() {
        return leaderboardService.getGlobalLeaderboard();
    }

    @GetMapping("/weekly")
    public List<LeaderboardEntryDto> getWeeklyLeaderboard() {
        return leaderboardService.getWeeklyLeaderboard();
    }

    @GetMapping("/monthly")
    public List<LeaderboardEntryDto> getMonthlyLeaderboard() {
        return leaderboardService.getMonthlyLeaderboard();
    }
}
