package com.stridemate.api.environment.controller;

import com.stridemate.api.environment.dto.EnvironmentResponseDto;
import com.stridemate.api.environment.service.EnvironmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/environment")
public class EnvironmentController {

    private final EnvironmentService environmentService;

    @Autowired
    public EnvironmentController(EnvironmentService environmentService) {
        this.environmentService = environmentService;
    }

    @GetMapping("/current")
    public ResponseEntity<EnvironmentResponseDto> getCurrentEnvironment(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            Authentication authentication) {
        return ResponseEntity.ok(environmentService.getCurrentEnvironment(lat, lon));
    }
}
