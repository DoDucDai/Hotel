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
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.DisputeService;

@RestController
@RequestMapping("/disputes")
public class DisputeController {

    private final DisputeService disputeService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public DisputeController(
            DisputeService disputeService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.disputeService = disputeService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @PostMapping
    public Dispute createDispute(
            @RequestBody CreateDisputeRequest request,
            Authentication authentication) {
        return disputeService.createDispute(authenticationEmailResolver.requireEmail(authentication), request);
    }

    @GetMapping("/my")
    public List<Dispute> getMyDisputes(Authentication authentication) {
        return disputeService.getMyDisputes(authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Dispute> getAllDisputes(Authentication authentication) {
        return disputeService.getAllDisputes(authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Dispute updateDisputeStatus(
            @PathVariable String id,
            @RequestBody UpdateDisputeStatusRequest request,
            Authentication authentication) {
        return disputeService.updateDisputeStatus(
                id,
                authenticationEmailResolver.requireEmail(authentication),
                request);
    }
}
