package com.example.hotelbooking.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.CreateDisputeRequest;
import com.example.hotelbooking.dto.UpdateDisputeStatusRequest;
import com.example.hotelbooking.model.Dispute;
import com.example.hotelbooking.service.DisputeService;

@RestController
@RequestMapping("/disputes")
public class DisputeController {

    private final DisputeService disputeService;

    public DisputeController(DisputeService disputeService) {
        this.disputeService = disputeService;
    }

    @PostMapping
    public Dispute createDispute(
            @RequestBody CreateDisputeRequest request,
            Authentication authentication) {
        return disputeService.createDispute(requireEmail(authentication), request);
    }

    @GetMapping("/my")
    public List<Dispute> getMyDisputes(Authentication authentication) {
        return disputeService.getMyDisputes(requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Dispute> getAllDisputes(Authentication authentication) {
        return disputeService.getAllDisputes(requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Dispute updateDisputeStatus(
            @PathVariable String id,
            @RequestBody UpdateDisputeStatusRequest request,
            Authentication authentication) {
        return disputeService.updateDisputeStatus(id, requireEmail(authentication), request);
    }

    private String requireEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        return authentication.getName();
    }
}
