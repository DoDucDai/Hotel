package com.example.hotelbooking.service;

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

    public User requireCurrentUser(String email) {
        String normalizedEmail = requireEmail(email);
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    public String requireEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Unauthorized");
        }

        return email.trim().toLowerCase();
    }

    public boolean isAdmin(User user) {
        return user != null && user.getRole() == Role.ADMIN;
    }

    public String requireUserId(User user) {
        if (user == null || user.getId() == null || user.getId().isBlank()) {
            throw new UnauthorizedException("Current user id is missing");
        }

        return user.getId();
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

    public String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }
}
