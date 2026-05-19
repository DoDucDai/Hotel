package com.example.hotelbooking.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.AdminDashboardDTO;
import com.example.hotelbooking.dto.UpdateDisputeStatusRequest;
import com.example.hotelbooking.dto.UpdateHotelApprovalRequest;
import com.example.hotelbooking.model.AuditLog;
import com.example.hotelbooking.model.Dispute;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.AdminService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public AdminController(
            AdminService adminService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.adminService = adminService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public AdminDashboardDTO getDashboard() {
        return adminService.getDashboard();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/hotels")
    public List<Hotel> getAllHotels() {
        return adminService.getAllHotels();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/hotels/{id}/approval")
    public Hotel updateHotelApproval(
            @PathVariable String id,
            @RequestBody UpdateHotelApprovalRequest request,
            Authentication authentication) {
        return adminService.updateHotelApproval(
                id,
                request,
                authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/disputes")
    public List<Dispute> getDisputes(Authentication authentication) {
        return adminService.getDisputes(authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/disputes/{id}")
    public Dispute updateDispute(
            @PathVariable String id,
            @RequestBody UpdateDisputeStatusRequest request,
            Authentication authentication) {
        return adminService.updateDispute(
                id,
                request,
                authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/logs")
    public List<AuditLog> getRecentLogs() {
        return adminService.getRecentLogs();
    }
}
