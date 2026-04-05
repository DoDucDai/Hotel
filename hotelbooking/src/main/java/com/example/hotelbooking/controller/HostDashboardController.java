package com.example.hotelbooking.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.HostDashboardDTO;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.HostDashboardService;

@RestController
@RequestMapping("/host")
public class HostDashboardController {

    private final HostDashboardService hostDashboardService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public HostDashboardController(
            HostDashboardService hostDashboardService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.hostDashboardService = hostDashboardService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping("/dashboard")
    public HostDashboardDTO getHostDashboard(Authentication authentication) {
        return hostDashboardService.getDashboard(authenticationEmailResolver.requireEmail(authentication));
    }
}
