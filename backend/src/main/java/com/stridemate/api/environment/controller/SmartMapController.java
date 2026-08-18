package com.stridemate.api.environment.controller;

import com.stridemate.api.environment.dto.SmartMapResponseDto;
import com.stridemate.api.environment.service.SmartMapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/map")
public class SmartMapController {

    private final SmartMapService smartMapService;

    @Autowired
    public SmartMapController(SmartMapService smartMapService) {
        this.smartMapService = smartMapService;
    }

    @GetMapping("/running-spots")
    public ResponseEntity<SmartMapResponseDto> getSmartRunningSpots(
            @RequestParam("lat") double lat,
            @RequestParam("lon") double lon,
            Authentication authentication) {
        return ResponseEntity.ok(smartMapService.getSmartRunningMap(lat, lon));
    }
}
