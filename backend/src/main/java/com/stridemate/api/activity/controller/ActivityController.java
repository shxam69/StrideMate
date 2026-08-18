package com.stridemate.api.activity.controller;

import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.dto.ActivityResponse;
import com.stridemate.api.activity.service.ActivityService;
import com.stridemate.api.gamification.dto.ActivitySaveResultDto;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    @Autowired
    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ResponseEntity<ActivitySaveResultDto> createActivity(@Valid @RequestBody ActivityRequest request, Authentication authentication) {
        ActivitySaveResultDto response = activityService.createActivity(request, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ActivityResponse>> getUserActivities(Authentication authentication) {
        List<ActivityResponse> activities = activityService.getUserActivities(authentication.getName());
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityResponse> getActivityById(@PathVariable UUID id, Authentication authentication) {
        ActivityResponse activity = activityService.getActivityById(id, authentication.getName());
        return ResponseEntity.ok(activity);
    }

    @GetMapping("/{id}/route")
    public ResponseEntity<com.stridemate.api.activity.dto.ActivityRouteResponseDto> getActivityRoute(
            @PathVariable UUID id,
            @RequestParam(value = "privacy", defaultValue = "false") boolean privacy,
            Authentication authentication) {
        return ResponseEntity.ok(activityService.getActivityRoute(id, authentication.getName(), privacy));
    }
}
