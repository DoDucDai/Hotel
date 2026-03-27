package com.example.hotelbooking.controller;

import java.util.Map;
import java.util.Objects;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.LoginRequest;
import com.example.hotelbooking.model.RefreshToken;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.security.JwtUtil;
import com.example.hotelbooking.service.RefreshTokenService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          RefreshTokenService refreshTokenService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    // REGISTER USER
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody User user) {
        String rawPassword = requireNonBlank(user.getPassword(), "Password is required");
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.USER);

        userRepository.save(user);

        return Map.of("message", "User registered successfully");
    }

    // LOGIN
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        String email = requireNonBlank(request.getEmail(), "Email is required");
        String password = requireNonBlank(request.getPassword(), "Password is required");
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String accessToken = JwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(user.getId());

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "role", user.getRole().name()
        );
    }

    // REFRESH TOKEN
    @PostMapping("/refresh")
    public Map<String, String> refreshToken(@RequestParam String refreshToken) {

        String tokenValue = requireNonBlank(refreshToken, "Refresh token is required");
        RefreshToken token = refreshTokenService.verify(tokenValue);
        String userId = requireNonBlank(token.getUserId(), "Token does not contain user id");

        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = JwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return Map.of("accessToken", accessToken);
    }

    // CREATE ADMIN
    @PostMapping("/create-admin")
    public Map<String, String> createAdmin(@RequestBody User user) {
        Objects.requireNonNull(user, "User payload is required");

        String rawPassword = requireNonBlank(user.getPassword(), "Password is required");
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.ADMIN);

        userRepository.save(user);

        return Map.of("message", "Admin created successfully");
    }
}

