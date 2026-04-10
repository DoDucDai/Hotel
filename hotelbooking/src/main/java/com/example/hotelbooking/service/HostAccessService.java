package com.example.hotelbooking.service;

import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class HostAccessService {

    private final UserRepository userRepository;

    public HostAccessService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public @NonNull User requireCurrentUser(String email) {
        String normalizedEmail = requireEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return Objects.requireNonNull(user, "User is required");
    }

    public @NonNull String requireEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Unauthorized");
        }

        return Objects.requireNonNull(email, "Email is required").trim().toLowerCase();
    }

    public boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    public @NonNull String requireUserId(User user) {
        if (user == null || user.getId() == null || user.getId().isBlank()) {
            throw new UnauthorizedException("Current user id is missing");
        }

        return Objects.requireNonNull(user.getId(), "User id is required");
    }

    public void assertEmailVerifiedForAction(User user, String actionLabel) {
        if (isAdmin(user)) {
            return;
        }

        if (!Boolean.TRUE.equals(user == null ? null : user.getEmailVerified())) {
            String normalizedAction = actionLabel == null || actionLabel.isBlank()
                    ? "thuc hien thao tac nay"
                    : actionLabel.trim();
            throw new ForbiddenException(
                    "Email chua duoc xac nhan. Vui long xac nhan email truoc khi " + normalizedAction);
        }
    }

    public void assertHotelOwner(User user, Hotel hotel) {
        if (isAdmin(user)) {
            return;
        }

        if (hotel == null || hotel.getOwnerId() == null || !hotel.getOwnerId().equals(requireUserId(user))) {
            throw new ForbiddenException("You do not have permission for this hotel");
        }
    }

    public void assertRoomOwner(User user, Room room) {
        if (isAdmin(user)) {
            return;
        }

        if (room == null || room.getOwnerId() == null || !room.getOwnerId().equals(requireUserId(user))) {
            throw new ForbiddenException("You do not have permission for this room");
        }
    }

    public @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }
}
