package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.CancelBookingRequest;
import com.example.hotelbooking.dto.CreateBookingRequest;
import com.example.hotelbooking.dto.RescheduleBookingRequest;
import com.example.hotelbooking.dto.UpdateBookingStatusRequest;
import com.example.hotelbooking.dto.UpdatePaymentStatusRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Coupon;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;
    private final HotelRepository hotelRepository;
    private final RoomInventoryService roomInventoryService;
    private final AuditLogService auditLogService;

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            CouponService couponService,
            HotelRepository hotelRepository,
            RoomInventoryService roomInventoryService,
            AuditLogService auditLogService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
        this.hotelRepository = hotelRepository;
        this.roomInventoryService = roomInventoryService;
        this.auditLogService = auditLogService;
    }

    public Booking createBooking(CreateBookingRequest request, String email) {
        CreateBookingRequest safeRequest = Objects.requireNonNull(request, "Booking is required");
        User user = getCurrentUser(email);

        Room room = roomRepository.findById(requireNonBlank(safeRequest.getRoomId(), "roomId is required"))
                .orElseThrow(() -> new RuntimeException("Room not found"));

        LocalDate checkInDate = safeRequest.getCheckInDate();
        LocalDate checkOutDate = safeRequest.getCheckOutDate();
        validateDateRange(checkInDate, checkOutDate);

        int guestCount = safeRequest.getGuestCount() > 0 ? safeRequest.getGuestCount() : 1;
        if (guestCount > room.getCapacity()) {
            throw new RuntimeException("So khach vuot qua suc chua cua phong");
        }

        int availableUnits = roomInventoryService.getMinimumAvailableUnits(room, checkInDate, checkOutDate, null);
        if (availableUnits <= 0) {
            throw new RuntimeException("Khong con phong trong khoang thoi gian nay");
        }

        long days = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
        double originalPrice = room.getPrice() * days;
        Coupon coupon = couponService.validateCoupon(safeRequest.getCouponCode(), originalPrice);
        double discountAmount = couponService.calculateDiscount(originalPrice, coupon);
        double finalPrice = Math.max(originalPrice - discountAmount, 0);

        PaymentMethod paymentMethod = safeRequest.getPaymentMethod() == null
                ? PaymentMethod.PAY_AT_HOTEL
                : safeRequest.getPaymentMethod();

        Booking booking = new Booking();
        booking.setUserId(user.getId());
        booking.setRoomId(room.getId());
        booking.setCheckInDate(checkInDate);
        booking.setCheckOutDate(checkOutDate);
        booking.setGuestCount(guestCount);
        booking.setNote(trimToNull(safeRequest.getNote()));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentMethod(paymentMethod);
        booking.setPaymentStatus(
                paymentMethod == PaymentMethod.PAY_AT_HOTEL
                        ? PaymentStatus.PENDING
                        : PaymentStatus.PAID
        );
        booking.setCouponCode(coupon != null ? coupon.getCode() : null);
        booking.setOriginalPrice(originalPrice);
        booking.setDiscountAmount(discountAmount);
        booking.setFinalPrice(finalPrice);
        booking.setTotalPrice(finalPrice);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setPaidAt(LocalDateTime.now());
        }

        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record(
                "CREATE_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Tao booking moi cho room " + room.getId());
        return savedBooking;
    }

    public Booking cancelBooking(String bookingId, String email, CancelBookingRequest request) {
        Booking booking = getBookingById(bookingId);
        User user = getCurrentUser(email);
        assertBookingOwner(user, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking nay da duoc huy truoc do");
        }

        if (booking.getCheckInDate() == null || !LocalDate.now().isBefore(booking.getCheckInDate())) {
            throw new RuntimeException("Chi co the huy booking truoc ngay nhan phong");
        }

        Hotel hotel = getHotelByRoomId(requireNonBlank(booking.getRoomId(), "Room id is required"));
        double refundAmount = calculateRefundAmount(booking, hotel);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(request == null ? null : trimToNull(request.getReason()));
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setRefundAmount(refundAmount);

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record(
                "CANCEL_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Huy booking va hoan " + refundAmount);
        return savedBooking;
    }

    public Booking rescheduleBooking(String bookingId, String email, RescheduleBookingRequest request) {
        Booking booking = getBookingById(bookingId);
        User user = getCurrentUser(email);
        assertBookingOwner(user, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Khong the doi lich cho booking da huy");
        }

        if (booking.getCheckInDate() == null || !LocalDate.now().isBefore(booking.getCheckInDate())) {
            throw new RuntimeException("Chi co the doi lich cho booking sap toi");
        }

        RescheduleBookingRequest safeRequest = Objects.requireNonNull(request, "Reschedule request is required");
        validateDateRange(safeRequest.getCheckInDate(), safeRequest.getCheckOutDate());

        Room room = roomRepository.findById(booking.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));
        int availableUnits = roomInventoryService.getMinimumAvailableUnits(
                room,
                safeRequest.getCheckInDate(),
                safeRequest.getCheckOutDate(),
                booking.getId());
        if (availableUnits <= 0) {
            throw new RuntimeException("Khong con phong trong khoang thoi gian nay");
        }

        long days = ChronoUnit.DAYS.between(safeRequest.getCheckInDate(), safeRequest.getCheckOutDate());
        double originalPrice = room.getPrice() * days;
        Coupon coupon = couponService.getCouponForExistingBooking(booking.getCouponCode());
        double discountAmount = couponService.calculateDiscount(originalPrice, coupon);
        double finalPrice = Math.max(originalPrice - discountAmount, 0);

        booking.setCheckInDate(safeRequest.getCheckInDate());
        booking.setCheckOutDate(safeRequest.getCheckOutDate());
        booking.setOriginalPrice(originalPrice);
        booking.setDiscountAmount(discountAmount);
        booking.setFinalPrice(finalPrice);
        booking.setTotalPrice(finalPrice);
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setLastRescheduledAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record(
                "RESCHEDULE_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Doi lich booking sang " + safeRequest.getCheckInDate() + " - " + safeRequest.getCheckOutDate());
        return savedBooking;
    }

    public Booking updatePaymentStatus(String bookingId, String email, UpdatePaymentStatusRequest request) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ban khong co quyen cap nhat payment status");
        }

        UpdatePaymentStatusRequest safeRequest =
                Objects.requireNonNull(request, "Payment status request is required");
        PaymentStatus nextStatus = Objects.requireNonNull(
                safeRequest.getPaymentStatus(),
                "Payment status is required");

        Booking booking = getBookingById(bookingId);
        booking.setPaymentStatus(nextStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        if (nextStatus == PaymentStatus.PAID) {
            booking.setPaidAt(
                    booking.getPaidAt() == null ? LocalDateTime.now() : booking.getPaidAt());
        } else if (nextStatus == PaymentStatus.PENDING || nextStatus == PaymentStatus.FAILED) {
            booking.setPaidAt(null);
        }

        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record(
                "UPDATE_PAYMENT_STATUS",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Cap nhat payment status sang " + nextStatus.name());
        return savedBooking;
    }

    public Booking updateBookingStatus(String bookingId, String email, UpdateBookingStatusRequest request) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Ban khong co quyen cap nhat trang thai luu tru");
        }

        UpdateBookingStatusRequest safeRequest = Objects.requireNonNull(request, "Booking status request is required");
        BookingStatus nextStatus = Objects.requireNonNull(safeRequest.getStatus(), "Booking status is required");
        Booking booking = getBookingById(bookingId);

        if (booking.getStatus() == BookingStatus.CANCELLED && nextStatus != BookingStatus.CANCELLED) {
            throw new RuntimeException("Khong the doi booking da huy sang trang thai khac");
        }

        booking.setStatus(nextStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        if (nextStatus == BookingStatus.CHECKED_IN && booking.getCheckedInAt() == null) {
            booking.setCheckedInAt(LocalDateTime.now());
        }

        if (nextStatus == BookingStatus.CHECKED_OUT) {
            if (booking.getCheckedInAt() == null) {
                booking.setCheckedInAt(LocalDateTime.now());
            }
            booking.setCheckedOutAt(LocalDateTime.now());
        }

        if (nextStatus == BookingStatus.NO_SHOW) {
            booking.setCheckedOutAt(null);
        }

        Booking savedBooking = bookingRepository.save(booking);
        auditLogService.record(
                "UPDATE_BOOKING_STATUS",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Cap nhat booking sang " + nextStatus.name());
        return savedBooking;
    }

    public void deleteBooking(String id) {
        bookingRepository.deleteById(requireNonBlank(id, "Booking id is required"));
    }

    public List<Booking> getBookingsByRoom(String roomId) {
        return bookingRepository.findByRoomId(requireNonBlank(roomId, "Room id is required"));
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public double getTotalRevenue() {
        return bookingRepository.findAll()
                .stream()
                .mapToDouble(this::resolveRevenueContribution)
                .sum();
    }

    private void validateDateRange(LocalDate checkInDate, LocalDate checkOutDate) {
        if (checkInDate == null || checkOutDate == null) {
            throw new IllegalArgumentException("checkInDate and checkOutDate must be provided");
        }

        if (checkInDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Ngay nhan phong khong hop le");
        }

        if (!checkOutDate.isAfter(checkInDate)) {
            throw new IllegalArgumentException("checkOutDate must be after checkInDate");
        }
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Booking getBookingById(String bookingId) {
        return bookingRepository.findById(requireNonBlank(bookingId, "Booking id is required"))
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    private void assertBookingOwner(User user, Booking booking) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (!Objects.equals(user.getId(), booking.getUserId())) {
            throw new RuntimeException("Ban khong co quyen thao tac booking nay");
        }
    }

    private double resolveFinalPrice(Booking booking) {
        double finalPrice = booking.getFinalPrice();
        if (finalPrice > 0) {
            return finalPrice;
        }

        return booking.getTotalPrice();
    }

    private double resolveRevenueContribution(Booking booking) {
        double gross = resolveFinalPrice(booking);
        double refundAmount = Math.max(booking.getRefundAmount(), 0);

        if (booking.getStatus() == BookingStatus.CANCELLED && booking.getPaymentStatus() == PaymentStatus.PENDING) {
            return 0;
        }

        return Math.max(gross - refundAmount, 0);
    }

    private double calculateRefundAmount(Booking booking, Hotel hotel) {
        if (booking.getPaymentStatus() != PaymentStatus.PAID) {
            return 0;
        }

        double finalPrice = resolveFinalPrice(booking);
        long daysBeforeCheckIn = ChronoUnit.DAYS.between(LocalDate.now(), booking.getCheckInDate());
        int freeCancellationDays = hotel == null ? 3 : Math.max(hotel.getFreeCancellationBeforeDays(), 0);
        int lateRefundRate = hotel == null ? 50 : clampPercent(hotel.getLateCancellationRefundRate());

        if (daysBeforeCheckIn >= freeCancellationDays) {
            return finalPrice;
        }

        return finalPrice * lateRefundRate / 100.0;
    }

    private int clampPercent(int value) {
        return Math.min(Math.max(value, 0), 100);
    }

    private Hotel getHotelByRoomId(String roomId) {
        Room room = roomRepository.findById(roomId).orElse(null);
        if (room == null || room.getHotelId() == null) {
            return null;
        }

        return hotelRepository.findById(room.getHotelId()).orElse(null);
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
            throw new IllegalArgumentException(message);
        }

        return value;
    }
}

