package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.CancelBookingRequest;
import com.example.hotelbooking.dto.CreateBookingRequest;
import com.example.hotelbooking.dto.RescheduleBookingRequest;
import com.example.hotelbooking.dto.UpdateBookingStatusRequest;
import com.example.hotelbooking.dto.UpdatePaymentStatusRequest;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
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
    private final RoomBookingLockService roomBookingLockService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            UserRepository userRepository,
            CouponService couponService,
            HotelRepository hotelRepository,
            RoomInventoryService roomInventoryService,
            RoomBookingLockService roomBookingLockService,
            AuditLogService auditLogService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
        this.couponService = couponService;
        this.hotelRepository = hotelRepository;
        this.roomInventoryService = roomInventoryService;
        this.roomBookingLockService = roomBookingLockService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public Booking createBooking(CreateBookingRequest request, String email) {
        CreateBookingRequest safeRequest = Objects.requireNonNull(request, "Booking is required");
        User user = getCurrentUser(email);
        assertEmailVerifiedForBooking(user);

        Room room = roomRepository.findById(requireNonBlank(safeRequest.getRoomId(), "roomId is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));

        LocalDate checkInDate = safeRequest.getCheckInDate();
        LocalDate checkOutDate = safeRequest.getCheckOutDate();
        validateDateRange(checkInDate, checkOutDate);

        int guestCount = safeRequest.getGuestCount() > 0 ? safeRequest.getGuestCount() : 1;
        if (guestCount > room.getCapacity()) {
            throw new BadRequestException("So khach vuot qua suc chua cua phong");
        }

        PaymentMethod paymentMethod = safeRequest.getPaymentMethod() == null
                ? PaymentMethod.PAY_AT_HOTEL
                : safeRequest.getPaymentMethod();

        Booking savedBooking = roomBookingLockService.executeWithLock(room.getId(), () -> {
            int availableUnits = roomInventoryService.getMinimumAvailableUnits(room, checkInDate, checkOutDate, null);
            if (availableUnits <= 0) {
                throw new BadRequestException("Khong con phong trong khoang thoi gian nay");
            }

            long days = ChronoUnit.DAYS.between(checkInDate, checkOutDate);
            double originalPrice = room.getPrice() * days;
            Coupon coupon = couponService.validateCoupon(safeRequest.getCouponCode(), originalPrice);
            double discountAmount = couponService.calculateDiscount(originalPrice, coupon);
            double finalPrice = Math.max(originalPrice - discountAmount, 0);

            Booking booking = new Booking();
            booking.setUserId(user.getId());
            booking.setRoomId(room.getId());
            booking.setCheckInDate(checkInDate);
            booking.setCheckOutDate(checkOutDate);
            booking.setGuestCount(guestCount);
            booking.setNote(trimToNull(safeRequest.getNote()));
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setPaymentMethod(paymentMethod);
            // Online payments stay pending until payment webhook confirms.
            booking.setPaymentStatus(PaymentStatus.PENDING);
            booking.setCouponCode(coupon != null ? coupon.getCode() : null);
            booking.setOriginalPrice(originalPrice);
            booking.setDiscountAmount(discountAmount);
            booking.setFinalPrice(finalPrice);
            booking.setTotalPrice(finalPrice);
            booking.setCreatedAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());
            booking.setPaidAt(null);

            return bookingRepository.save(booking);
        });
        auditLogService.record(
                "CREATE_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Tao booking moi cho room " + room.getId());

        notificationService.createForUser(
                user.getId(),
                "BOOKING",
                "Dat phong thanh cong",
                "Booking " + savedBooking.getId() + " da duoc tao va xac nhan.",
                "BOOKING",
                savedBooking.getId(),
                true);

        if (room.getOwnerId() != null && !room.getOwnerId().equals(user.getId())) {
            notificationService.createForUser(
                    room.getOwnerId(),
                    "HOST_BOOKING",
                    "Co booking moi",
                    "Room " + room.getName() + " vua co booking moi: " + savedBooking.getId(),
                    "BOOKING",
                    savedBooking.getId(),
                    false);
        }
        return savedBooking;
    }

    public Booking cancelBooking(String bookingId, String email, CancelBookingRequest request) {
        Booking booking = getBookingById(bookingId);
        User user = getCurrentUser(email);
        assertBookingOwner(user, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking nay da duoc huy truoc do");
        }

        if (booking.getCheckInDate() == null || !LocalDate.now().isBefore(booking.getCheckInDate())) {
            throw new BadRequestException("Chi co the huy booking truoc ngay nhan phong");
        }

        Booking savedBooking = roomBookingLockService.executeWithLock(booking.getRoomId(), () -> {
            Booking lockedBooking = getBookingById(bookingId);
            Hotel hotel = getHotelByRoomId(requireNonBlank(lockedBooking.getRoomId(), "Room id is required"));
            double refundAmount = calculateRefundAmount(lockedBooking, hotel);

            lockedBooking.setStatus(BookingStatus.CANCELLED);
            lockedBooking.setCancellationReason(request == null ? null : trimToNull(request.getReason()));
            lockedBooking.setUpdatedAt(LocalDateTime.now());
            lockedBooking.setRefundAmount(refundAmount);

            if (lockedBooking.getPaymentStatus() == PaymentStatus.PAID) {
                lockedBooking.setPaymentStatus(PaymentStatus.REFUNDED);
            }

            return bookingRepository.save(lockedBooking);
        });

        double refundAmount = savedBooking.getRefundAmount();
        auditLogService.record(
                "CANCEL_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Huy booking va hoan " + refundAmount);

        notificationService.createForUser(
                savedBooking.getUserId(),
                "BOOKING",
                "Booking da duoc huy",
                "Booking " + savedBooking.getId() + " da duoc huy. So tien hoan: " + refundAmount,
                "BOOKING",
                savedBooking.getId(),
                true);
        return savedBooking;
    }

    public Booking rescheduleBooking(String bookingId, String email, RescheduleBookingRequest request) {
        Booking booking = getBookingById(bookingId);
        User user = getCurrentUser(email);
        assertBookingOwner(user, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Khong the doi lich cho booking da huy");
        }

        if (booking.getCheckInDate() == null || !LocalDate.now().isBefore(booking.getCheckInDate())) {
            throw new BadRequestException("Chi co the doi lich cho booking sap toi");
        }

        RescheduleBookingRequest safeRequest = Objects.requireNonNull(request, "Reschedule request is required");
        validateDateRange(safeRequest.getCheckInDate(), safeRequest.getCheckOutDate());

        Booking savedBooking = roomBookingLockService.executeWithLock(booking.getRoomId(), () -> {
            Booking lockedBooking = getBookingById(bookingId);
            Room room = roomRepository.findById(requireNonBlank(lockedBooking.getRoomId(), "Room id is required"))
                    .orElseThrow(() -> new NotFoundException("Room not found"));
            int availableUnits = roomInventoryService.getMinimumAvailableUnits(
                    room,
                    safeRequest.getCheckInDate(),
                    safeRequest.getCheckOutDate(),
                    lockedBooking.getId());
            if (availableUnits <= 0) {
                throw new BadRequestException("Khong con phong trong khoang thoi gian nay");
            }

            long days = ChronoUnit.DAYS.between(safeRequest.getCheckInDate(), safeRequest.getCheckOutDate());
            double originalPrice = room.getPrice() * days;
            Coupon coupon = couponService.getCouponForExistingBooking(lockedBooking.getCouponCode());
            double discountAmount = couponService.calculateDiscount(originalPrice, coupon);
            double finalPrice = Math.max(originalPrice - discountAmount, 0);

            lockedBooking.setCheckInDate(safeRequest.getCheckInDate());
            lockedBooking.setCheckOutDate(safeRequest.getCheckOutDate());
            lockedBooking.setOriginalPrice(originalPrice);
            lockedBooking.setDiscountAmount(discountAmount);
            lockedBooking.setFinalPrice(finalPrice);
            lockedBooking.setTotalPrice(finalPrice);
            lockedBooking.setUpdatedAt(LocalDateTime.now());
            lockedBooking.setLastRescheduledAt(LocalDateTime.now());

            return bookingRepository.save(lockedBooking);
        });
        auditLogService.record(
                "RESCHEDULE_BOOKING",
                "BOOKING",
                savedBooking.getId(),
                user,
                "Doi lich booking sang " + safeRequest.getCheckInDate() + " - " + safeRequest.getCheckOutDate());

        notificationService.createForUser(
                savedBooking.getUserId(),
                "BOOKING",
                "Booking da duoc doi lich",
                "Booking " + savedBooking.getId()
                        + " duoc doi lich sang " + safeRequest.getCheckInDate()
                        + " - " + safeRequest.getCheckOutDate(),
                "BOOKING",
                savedBooking.getId(),
                true);
        return savedBooking;
    }

    public Booking updatePaymentStatus(String bookingId, String email, UpdatePaymentStatusRequest request) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Ban khong co quyen cap nhat payment status");
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

        notificationService.createForUser(
                savedBooking.getUserId(),
                "BOOKING_PAYMENT",
                "Cap nhat thanh toan booking",
                "Booking " + savedBooking.getId() + " da cap nhat trang thai thanh toan: " + nextStatus.name(),
                "BOOKING",
                savedBooking.getId(),
                true);
        return savedBooking;
    }

    public Booking updateBookingStatus(String bookingId, String email, UpdateBookingStatusRequest request) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Ban khong co quyen cap nhat trang thai luu tru");
        }

        UpdateBookingStatusRequest safeRequest = Objects.requireNonNull(request, "Booking status request is required");
        BookingStatus nextStatus = Objects.requireNonNull(safeRequest.getStatus(), "Booking status is required");
        Booking booking = getBookingById(bookingId);

        if (booking.getStatus() == BookingStatus.CANCELLED && nextStatus != BookingStatus.CANCELLED) {
            throw new BadRequestException("Khong the doi booking da huy sang trang thai khac");
        }

        booking.setStatus(nextStatus);
        if (safeRequest.getNote() != null) {
            booking.setNote(trimToNull(safeRequest.getNote()));
        }
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

        notificationService.createForUser(
                savedBooking.getUserId(),
                "BOOKING_STATUS",
                "Cap nhat trang thai luu tru",
                "Booking " + savedBooking.getId() + " da chuyen sang trang thai " + nextStatus.name(),
                "BOOKING",
                savedBooking.getId(),
                true);
        return savedBooking;
    }

    public void deleteBooking(String id, String email) {
        Booking booking = getBookingById(id);
        User user = getCurrentUser(email);
        assertBookingOwner(user, booking);
        bookingRepository.deleteById(requireNonBlank(id, "Booking id is required"));
    }

    public List<Booking> getBookingsByRoom(String roomId, String email) {
        User user = getCurrentUser(email);
        Room room = roomRepository.findById(requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room not found"));

        if (user.getRole() != Role.ADMIN && !Objects.equals(user.getId(), room.getOwnerId())) {
            throw new ForbiddenException("Ban khong co quyen xem booking theo room");
        }

        return bookingRepository.findByRoomId(room.getId());
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getVisibleBookings(String email) {
        User user = getCurrentUser(email);
        if (user.getRole() == Role.ADMIN) {
            return bookingRepository.findAll();
        }

        return bookingRepository.findByUserId(user.getId());
    }

    public List<Booking> getMyBookings(String email) {
        User user = getCurrentUser(email);
        return bookingRepository.findByUserId(user.getId());
    }

    public double getTotalRevenue(String email) {
        User user = getCurrentUser(email);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Ban khong co quyen xem doanh thu he thong");
        }

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
            throw new BadRequestException("Ngay nhan phong khong hop le");
        }

        if (!checkOutDate.isAfter(checkInDate)) {
            throw new IllegalArgumentException("checkOutDate must be after checkInDate");
        }
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private Booking getBookingById(String bookingId) {
        return bookingRepository.findById(requireNonBlank(bookingId, "Booking id is required"))
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private void assertBookingOwner(User user, Booking booking) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (!Objects.equals(user.getId(), booking.getUserId())) {
            throw new ForbiddenException("Ban khong co quyen thao tac booking nay");
        }
    }

    private void assertEmailVerifiedForBooking(User user) {
        if (user != null && user.getRole() == Role.ADMIN) {
            return;
        }

        if (!Boolean.TRUE.equals(user == null ? null : user.getEmailVerified())) {
            throw new ForbiddenException("Email chua duoc xac nhan. Vui long xac nhan email truoc khi dat phong");
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
        String normalizedRoomId = requireNonBlank(roomId, "Room id is required");
        Room room = roomRepository.findById(normalizedRoomId).orElse(null);
        if (room == null || room.getHotelId() == null) {
            return null;
        }

        String hotelId = room.getHotelId();
        return hotelRepository.findById(Objects.requireNonNull(hotelId)).orElse(null);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
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
}

