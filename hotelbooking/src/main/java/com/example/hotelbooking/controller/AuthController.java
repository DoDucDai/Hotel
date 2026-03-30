package com.example.hotelbooking.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.EmailRequest;
import com.example.hotelbooking.dto.LoginRequest;
import com.example.hotelbooking.dto.ResetPasswordRequest;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody User user) {
        return authService.register(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public Map<String, String> refreshToken(@RequestParam String refreshToken) {
        return authService.refreshToken(refreshToken);
    }

    @PostMapping("/create-admin")
    public Map<String, Object> createAdmin(@RequestBody User user) {
        return authService.createAdmin(user);
    }

    @PostMapping("/resend-verification")
    public Map<String, String> resendVerification(@RequestBody EmailRequest request) {
        return authService.resendVerificationEmail(request);
    }

    @GetMapping("/verify-email")
    public Map<String, Object> verifyEmail(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@RequestBody EmailRequest request) {
        return authService.forgotPassword(request);
    }

    @GetMapping("/reset-password/validate")
    public Map<String, Object> validateResetPasswordToken(@RequestParam String token) {
        return authService.validateResetPasswordToken(token);
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }
}

