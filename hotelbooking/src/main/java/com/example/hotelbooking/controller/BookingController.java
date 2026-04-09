package com.example.hotelbooking.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
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
import com.example.hotelbooking.dto.UpdateBookingStatusRequest;
import com.example.hotelbooking.dto.UpdatePaymentStatusRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.BookingService;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public BookingController(
            BookingService bookingService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.bookingService = bookingService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping
    public List<Booking> getBookings(Authentication authentication) {
        return bookingService.getVisibleBookings(authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping
    public Booking createBooking(
            @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        return bookingService.createBooking(request, authenticationEmailResolver.requireEmail(authentication));
    }

    @PutMapping("/{id}/cancel")
    public Booking cancelBooking(
            @PathVariable String id,
            @RequestBody(required = false) CancelBookingRequest request,
            Authentication authentication) {
        return bookingService.cancelBooking(id, authenticationEmailResolver.requireEmail(authentication), request);
    }

    @PutMapping("/{id}/reschedule")
    public Booking rescheduleBooking(
            @PathVariable String id,
            @RequestBody RescheduleBookingRequest request,
            Authentication authentication) {
        return bookingService.rescheduleBooking(id, authenticationEmailResolver.requireEmail(authentication), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/payment-status")
    public Booking updatePaymentStatus(
            @PathVariable String id,
            @RequestBody UpdatePaymentStatusRequest request,
            Authentication authentication) {
        return bookingService.updatePaymentStatus(
                id,
                authenticationEmailResolver.requireEmail(authentication),
                request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/status")
    public Booking updateBookingStatus(
            @PathVariable String id,
            @RequestBody UpdateBookingStatusRequest request,
            Authentication authentication) {
        return bookingService.updateBookingStatus(
                id,
                authenticationEmailResolver.requireEmail(authentication),
                request);
    }

    @DeleteMapping("/{id}")
    public void deleteBooking(@PathVariable String id, Authentication authentication) {
        bookingService.deleteBooking(id, authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/room/{roomId}")
    public List<Booking> getBookingsByRoom(
            @PathVariable String roomId,
            Authentication authentication) {
        return bookingService.getBookingsByRoom(roomId, authenticationEmailResolver.requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/revenue")
    public double getRevenue(Authentication authentication) {
        return bookingService.getTotalRevenue(authenticationEmailResolver.requireEmail(authentication));
    }

    @GetMapping("/my")
    public List<Booking> getMyBookings(Authentication authentication) {
        return bookingService.getMyBookings(authenticationEmailResolver.requireEmail(authentication));
    }
}
