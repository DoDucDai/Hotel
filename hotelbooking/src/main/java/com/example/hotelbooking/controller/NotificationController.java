package com.example.hotelbooking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.NotificationDTO;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.NotificationService;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public NotificationController(
            NotificationService notificationService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.notificationService = notificationService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping("/my")
    public List<NotificationDTO> getMyNotifications(Authentication authentication) {
        return notificationService.getMyNotifications(authenticationEmailResolver.requireEmail(authentication));
    }

    @GetMapping("/my/unread-count")
    public Map<String, Long> getUnreadCount(Authentication authentication) {
        return notificationService.getUnreadCount(authenticationEmailResolver.requireEmail(authentication));
    }

    @PutMapping("/{id}/read")
    public NotificationDTO markAsRead(@PathVariable String id, Authentication authentication) {
        return notificationService.markAsRead(id, authenticationEmailResolver.requireEmail(authentication));
    }

    @PutMapping("/my/read-all")
    public Map<String, Integer> markAllAsRead(Authentication authentication) {
        return notificationService.markAllAsRead(authenticationEmailResolver.requireEmail(authentication));
    }
}
