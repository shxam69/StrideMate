package com.stridemate.api.gamification.controller;

import com.stridemate.api.gamification.dto.AchievementDto;
import com.stridemate.api.gamification.dto.DailyQuestDto;
import com.stridemate.api.gamification.dto.UserProgressDto;
import com.stridemate.api.gamification.service.GamificationService;
import com.stridemate.api.user.entity.User;
import com.stridemate.api.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class GamificationController {

    private final GamificationService gamificationService;
    private final UserRepository userRepository;

    @Autowired
    public GamificationController(GamificationService gamificationService, UserRepository userRepository) {
        this.gamificationService = gamificationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/progression")
    public ResponseEntity<UserProgressDto> getProgression(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(gamificationService.getUserProgressDto(user));
    }

    @GetMapping("/quests/today")
    public ResponseEntity<List<DailyQuestDto>> getTodayQuests(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(gamificationService.getTodayQuestsDto(user));
    }

    @GetMapping("/achievements")
    public ResponseEntity<List<AchievementDto>> getAchievements(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(gamificationService.getAllAchievementsWithUserStatus(user));
    }
}
