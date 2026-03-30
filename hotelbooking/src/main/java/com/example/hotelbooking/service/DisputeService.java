package com.example.hotelbooking.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.CreateDisputeRequest;
import com.example.hotelbooking.dto.UpdateDisputeStatusRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.Dispute;
import com.example.hotelbooking.model.DisputeStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.DisputeRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final AuditLogService auditLogService;

    public DisputeService(
            DisputeRepository disputeRepository,
            BookingRepository bookingRepository,
            UserRepository userRepository,
            RoomRepository roomRepository,
            AuditLogService auditLogService) {
        this.disputeRepository = disputeRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.roomRepository = roomRepository;
        this.auditLogService = auditLogService;
    }

    public Dispute createDispute(String email, CreateDisputeRequest request) {
        User user = getCurrentUser(email);
        CreateDisputeRequest safeRequest = Objects.requireNonNull(request, "Dispute request is required");
        String bookingId = requireNonBlank(safeRequest.getBookingId(), "Booking id is required");

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking khong ton tai"));

        if (!Objects.equals(user.getId(), booking.getUserId()) && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ban khong co quyen gui tranh chap cho booking nay");
        }

        if (disputeRepository.existsByBookingIdAndUserId(bookingId, user.getId())) {
            throw new RuntimeException("Booking nay da co tranh chap dang xu ly");
        }

        Room room = roomRepository.findById(requireNonBlank(booking.getRoomId(), "Room id is required"))
                .orElse(null);

        Dispute dispute = new Dispute();
        dispute.setBookingId(bookingId);
        dispute.setUserId(user.getId());
        dispute.setRoomId(booking.getRoomId());
        dispute.setHotelId(room == null ? null : room.getHotelId());
        dispute.setSubject(requireNonBlank(safeRequest.getSubject(), "Chu de tranh chap la bat buoc"));
        dispute.setDescription(requireNonBlank(safeRequest.getDescription(), "Noi dung tranh chap la bat buoc"));
        dispute.setStatus(DisputeStatus.OPEN);
        dispute.setCreatedAt(LocalDateTime.now());
        dispute.setUpdatedAt(LocalDateTime.now());

        Dispute savedDispute = disputeRepository.save(dispute);
        auditLogService.record(
                "CREATE_DISPUTE",
                "DISPUTE",
                savedDispute.getId(),
                user,
                "Nguoi dung tao tranh chap cho booking " + bookingId);
        return savedDispute;
    }

    public List<Dispute> getMyDisputes(String email) {
        User user = getCurrentUser(email);
        return disputeRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Dispute> getAllDisputes(String email) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ban khong co quyen xem tranh chap");
        }

        return disputeRepository.findAllByOrderByCreatedAtDesc();
    }

    public Dispute updateDisputeStatus(String disputeId, String email, UpdateDisputeStatusRequest request) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ban khong co quyen xu ly tranh chap");
        }

        UpdateDisputeStatusRequest safeRequest = Objects.requireNonNull(request, "Dispute status request is required");
        Dispute dispute = disputeRepository.findById(requireNonBlank(disputeId, "Dispute id is required"))
                .orElseThrow(() -> new RuntimeException("Khong tim thay tranh chap"));

        dispute.setStatus(Objects.requireNonNull(safeRequest.getStatus(), "Trang thai tranh chap la bat buoc"));
        dispute.setResolutionNote(trimToNull(safeRequest.getResolutionNote()));
        dispute.setUpdatedAt(LocalDateTime.now());

        Dispute savedDispute = disputeRepository.save(dispute);
        auditLogService.record(
                "UPDATE_DISPUTE_STATUS",
                "DISPUTE",
                savedDispute.getId(),
                user,
                "Admin cap nhat tranh chap sang " + savedDispute.getStatus().name());
        return savedDispute;
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }
}
