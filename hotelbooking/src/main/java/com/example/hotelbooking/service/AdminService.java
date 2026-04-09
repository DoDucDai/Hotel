package com.example.hotelbooking.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.AdminDashboardDTO;
import com.example.hotelbooking.dto.UpdateDisputeStatusRequest;
import com.example.hotelbooking.dto.UpdateHotelApprovalRequest;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
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

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final DisputeService disputeService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public AdminService(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository,
            DisputeService disputeService,
            AuditLogService auditLogService,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.disputeService = disputeService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

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
                revenue);
    }

    public List<Hotel> getAllHotels() {
        return hotelRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    public Hotel updateHotelApproval(
            String id,
            UpdateHotelApprovalRequest request,
            String adminEmail) {
        User admin = getCurrentUser(adminEmail);
        UpdateHotelApprovalRequest payload = request == null ? new UpdateHotelApprovalRequest() : request;

        Hotel hotel = hotelRepository.findById(requireNonBlank(id, "Hotel id is required"))
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hotel.setApprovalStatus(payload.getStatus() == null ? HotelApprovalStatus.PENDING : payload.getStatus());
        hotel.setApprovalNote(trimToNull(payload.getNote()));
        hotel.setApprovedByUserId(admin.getId());
        hotel.setApprovedAt(hotel.getApprovalStatus() == HotelApprovalStatus.APPROVED ? LocalDateTime.now() : null);

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record(
                "HOTEL_APPROVAL",
                "HOTEL",
                savedHotel.getId(),
                admin,
                "Cap nhat hotel sang " + savedHotel.getApprovalStatus().name());

        if (savedHotel.getOwnerId() != null && !savedHotel.getOwnerId().isBlank()) {
            notificationService.createForUser(
                    savedHotel.getOwnerId(),
                    "HOTEL_APPROVAL",
                    "Cap nhat duyet khach san",
                    "Hotel " + savedHotel.getName() + " da duoc cap nhat trang thai: "
                            + savedHotel.getApprovalStatus().name(),
                    "HOTEL",
                    savedHotel.getId(),
                    true);
        }

        return savedHotel;
    }

    public List<Dispute> getDisputes(String adminEmail) {
        return disputeService.getAllDisputes(requireNonBlank(adminEmail, "Unauthorized"));
    }

    public Dispute updateDispute(
            String id,
            UpdateDisputeStatusRequest request,
            String adminEmail) {
        return disputeService.updateDisputeStatus(
                requireNonBlank(id, "Dispute id is required"),
                requireNonBlank(adminEmail, "Unauthorized"),
                request);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogService.getRecentLogs();
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private double resolveRevenue(Booking booking) {
        double gross = booking.getFinalPrice() > 0 ? booking.getFinalPrice() : booking.getTotalPrice();
        return Math.max(gross - Math.max(booking.getRefundAmount(), 0), 0);
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            if ("Unauthorized".equalsIgnoreCase(message)) {
                throw new UnauthorizedException(message);
            }

            throw new BadRequestException(message);
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
