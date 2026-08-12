package com.stridemate.api.activity.controller;

import com.stridemate.api.activity.dto.ActivityRequest;
import com.stridemate.api.activity.dto.ActivityResponse;
import com.stridemate.api.activity.service.ActivityService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityService activityService;

    @Autowired
    public ActivityController(ActivityService activityService) {
        this.activityService = activityService;
    }

    @PostMapping
    public ResponseEntity<ActivityResponse> createActivity(@Valid @RequestBody ActivityRequest request, Authentication authentication) {
        ActivityResponse response = activityService.createActivity(request, authentication.getName());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
