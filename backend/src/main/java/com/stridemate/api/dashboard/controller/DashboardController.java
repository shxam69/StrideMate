package com.stridemate.api.dashboard.controller;

import com.stridemate.api.dashboard.dto.DashboardResponseDto;
import com.stridemate.api.dashboard.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/me")
    public DashboardResponseDto getMyDashboard(Authentication authentication) {
        return dashboardService.getDashboardForUser(authentication.getName());
    }
}
