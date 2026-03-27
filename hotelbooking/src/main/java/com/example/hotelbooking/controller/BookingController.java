package com.example.hotelbooking.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.CancelBookingRequest;
import com.example.hotelbooking.dto.CreateBookingRequest;
import com.example.hotelbooking.dto.RescheduleBookingRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.service.BookingService;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final UserRepository userRepository;

    public BookingController(
            BookingRepository bookingRepository,
            BookingService bookingService,
            UserRepository userRepository) {

        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    @GetMapping
    public List<Booking> getBookings() {
        return bookingRepository.findAll();
    }

    @PostMapping
    public Booking createBooking(
            @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        return bookingService.createBooking(request, requireNonBlank(authentication.getName(), "Unauthorized"));
    }

    @PutMapping("/{id}/cancel")
    public Booking cancelBooking(
            @PathVariable String id,
            @RequestBody(required = false) CancelBookingRequest request,
            Authentication authentication) {
        return bookingService.cancelBooking(id, requireNonBlank(authentication.getName(), "Unauthorized"), request);
    }

    @PutMapping("/{id}/reschedule")
    public Booking rescheduleBooking(
            @PathVariable String id,
            @RequestBody RescheduleBookingRequest request,
            Authentication authentication) {
        return bookingService.rescheduleBooking(id, requireNonBlank(authentication.getName(), "Unauthorized"), request);
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable String id) {
        String bookingId = requireNonBlank(id, "Booking id is required");
        bookingService.deleteBooking(bookingId);
    }

    @GetMapping("/room/{roomId}")
    public List<Booking> getBookingsByRoom(@PathVariable String roomId) {
        String normalizedRoomId = requireNonBlank(roomId, "Room id is required");
        return bookingService.getBookingsByRoom(normalizedRoomId);
    }

    @GetMapping("/revenue")
    public double getRevenue() {
        return bookingService.getTotalRevenue();
    }

    @GetMapping("/my")
    public List<Booking> getMyBookings(Authentication authentication) {

        String email = requireNonBlank(authentication.getName(), "Unauthorized");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return bookingRepository.findByUserId(user.getId());
    }
}
