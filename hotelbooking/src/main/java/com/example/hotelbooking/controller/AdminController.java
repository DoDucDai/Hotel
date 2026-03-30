package com.example.hotelbooking.controller;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.AdminDashboardDTO;
import com.example.hotelbooking.dto.UpdateDisputeStatusRequest;
import com.example.hotelbooking.dto.UpdateHotelApprovalRequest;
import com.example.hotelbooking.model.AuditLog;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.Dispute;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.service.AuditLogService;
import com.example.hotelbooking.service.DisputeService;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final DisputeService disputeService;
    private final AuditLogService auditLogService;

    public AdminController(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository,
            DisputeService disputeService,
            AuditLogService auditLogService) {

        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.disputeService = disputeService;
        this.auditLogService = auditLogService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public AdminDashboardDTO getDashboard() {

        long totalUsers = userRepository.count();
        long totalHotels = hotelRepository.count();
        long totalRooms = roomRepository.count();
        long totalBookings = bookingRepository.count();

        double revenue = bookingRepository.findAll()
                .stream()
                .mapToDouble(this::resolveRevenue)
                .sum();

        return new AdminDashboardDTO(
                totalUsers,
                totalHotels,
                totalRooms,
                totalBookings,
                revenue
        );
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/hotels")
    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/hotels/{id}/approval")
    public Hotel updateHotelApproval(
            @PathVariable String id,
            @RequestBody UpdateHotelApprovalRequest request,
            Authentication authentication) {

        User admin = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(requireNonBlank(id, "Hotel id is required"))
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        hotel.setApprovalStatus(request.getStatus() == null ? HotelApprovalStatus.PENDING : request.getStatus());
        hotel.setApprovalNote(trimToNull(request.getNote()));
        hotel.setApprovedByUserId(admin.getId());
        hotel.setApprovedAt(hotel.getApprovalStatus() == HotelApprovalStatus.APPROVED ? LocalDateTime.now() : null);

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record(
                "HOTEL_APPROVAL",
                "HOTEL",
                savedHotel.getId(),
                admin,
                "Cap nhat hotel sang " + savedHotel.getApprovalStatus().name());
        return savedHotel;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/disputes")
    public List<Dispute> getDisputes(Authentication authentication) {
        return disputeService.getAllDisputes(requireEmail(authentication));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/disputes/{id}")
    public Dispute updateDispute(
            @PathVariable String id,
            @RequestBody UpdateDisputeStatusRequest request,
            Authentication authentication) {
        return disputeService.updateDisputeStatus(id, requireEmail(authentication), request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/logs")
    public List<AuditLog> getRecentLogs() {
        return auditLogService.getRecentLogs();
    }

    private double resolveRevenue(Booking booking) {
        double gross = booking.getFinalPrice() > 0 ? booking.getFinalPrice() : booking.getTotalPrice();
        return Math.max(gross - Math.max(booking.getRefundAmount(), 0), 0);
    }

    private String requireEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        return authentication.getName();
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(requireEmail(authentication))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
