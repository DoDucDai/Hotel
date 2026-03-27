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
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Coupon;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final CouponService couponService;

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            CouponService couponService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
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

        ensureRoomAvailability(room.getId(), checkInDate, checkOutDate, null);

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

        return bookingRepository.save(booking);
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

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancellationReason(request == null ? null : trimToNull(request.getReason()));
        booking.setUpdatedAt(LocalDateTime.now());

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            booking.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        return bookingRepository.save(booking);
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
        ensureRoomAvailability(
                requireNonBlank(booking.getRoomId(), "Room id is required"),
                safeRequest.getCheckInDate(),
                safeRequest.getCheckOutDate(),
                booking.getId()
        );

        Room room = roomRepository.findById(booking.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

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

        return bookingRepository.save(booking);
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
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .mapToDouble(this::resolveFinalPrice)
                .sum();
    }

    private void ensureRoomAvailability(
            String roomId,
            LocalDate newCheckIn,
            LocalDate newCheckOut,
            String excludedBookingId) {

        List<Booking> bookings = bookingRepository.findByRoomId(roomId);

        for (Booking existingBooking : bookings) {
            if (existingBooking.getStatus() == BookingStatus.CANCELLED) {
                continue;
            }

            if (excludedBookingId != null && excludedBookingId.equals(existingBooking.getId())) {
                continue;
            }

            LocalDate existingCheckIn = existingBooking.getCheckInDate();
            LocalDate existingCheckOut = existingBooking.getCheckOutDate();

            if (existingCheckIn == null || existingCheckOut == null) {
                continue;
            }

            boolean isOverlap =
                    newCheckIn.isBefore(existingCheckOut)
                            && newCheckOut.isAfter(existingCheckIn);

            if (isOverlap) {
                throw new RuntimeException("Phong da duoc dat trong khoang thoi gian nay");
            }
        }
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

