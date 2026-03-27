package com.example.hotelbooking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.UpdateEmailRequest;
import com.example.hotelbooking.dto.UpdateProfileRequest;
import com.example.hotelbooking.dto.UserAccountResponse;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.security.JwtUtil;
import com.example.hotelbooking.service.UserService;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET all users (ADMIN)
    @GetMapping
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET user by id
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // CREATE user
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    // UPDATE user (ADMIN)
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id,
                                           @RequestBody User updatedUser) {
        return ResponseEntity.ok(userService.updateUser(id, updatedUser));
    }

    // DELETE user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // GET current user account
    @GetMapping("/me")
    public UserAccountResponse getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        return userService.getCurrentUserAccount(email);
    }

    // UPDATE current user profile
    @PutMapping("/me/profile")
    public ResponseEntity<UserAccountResponse> updateCurrentUserProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {

        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateCurrentUserProfile(email, request));
    }

    // UPDATE current user email and issue new access token
    @PutMapping("/me/email")
    public ResponseEntity<Map<String, Object>> updateCurrentUserEmail(
            Authentication authentication,
            @RequestBody UpdateEmailRequest request) {

        String currentEmail = authentication.getName();
        User updatedUser = userService.updateCurrentUserEmail(currentEmail, request.getEmail());

        String accessToken = JwtUtil.generateToken(
                updatedUser.getEmail(),
                updatedUser.getRole().name()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Email updated successfully",
                "accessToken", accessToken,
                "role", updatedUser.getRole().name(),
                "user", UserAccountResponse.fromUser(updatedUser)
        ));
    }
}
