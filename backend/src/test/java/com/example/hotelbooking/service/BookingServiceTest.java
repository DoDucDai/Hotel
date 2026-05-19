package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.hotelbooking.dto.CreateBookingRequest;
import com.example.hotelbooking.dto.UpdateBookingStatusRequest;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CouponService couponService;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomInventoryService roomInventoryService;

    @Mock
    private RoomBookingLockService roomBookingLockService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(
                bookingRepository,
                roomRepository,
                userRepository,
                couponService,
                hotelRepository,
                roomInventoryService,
                roomBookingLockService,
                auditLogService,
                notificationService);

    }

    @Test
    void getVisibleBookingsAsAdminReturnsAll() {
        User admin = new User();
        admin.setId("admin-id");
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(bookingRepository.findAll()).thenReturn(List.of(new Booking(), new Booking()));

        List<Booking> bookings = bookingService.getVisibleBookings("admin@example.com");

        assertEquals(2, bookings.size());
        verify(bookingRepository, never()).findByUserId(anyString());
    }

    @Test
    void createBookingFailsWhenEmailNotVerified() {
        User user = new User();
        user.setId("user-id");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);
        user.setEmailVerified(Boolean.FALSE);

        CreateBookingRequest request = new CreateBookingRequest();
        request.setRoomId("room-1");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> bookingService.createBooking(request, "user@example.com"));

        assertEquals("Email chua duoc xac nhan. Vui long xac nhan email truoc khi dat phong", ex.getMessage());
        verify(roomRepository, never()).findById("room-1");
    }

    @Test
    void getVisibleBookingsAsUserReturnsOwnOnly() {
        User user = new User();
        user.setId("user-id");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserId("user-id")).thenReturn(List.of(new Booking()));

        List<Booking> bookings = bookingService.getVisibleBookings("user@example.com");

        assertEquals(1, bookings.size());
        verify(bookingRepository, never()).findAll();
    }

    @Test
    void deleteBookingFailsWhenUserIsNotOwner() {
        User user = new User();
        user.setId("user-id");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        Booking booking = new Booking();
        booking.setId("booking-1");
        booking.setUserId("other-user");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(
                RuntimeException.class,
                () -> bookingService.deleteBooking("booking-1", "user@example.com"));

        assertEquals("Ban khong co quyen thao tac booking nay", ex.getMessage());
        verify(bookingRepository, never()).deleteById("booking-1");
    }

    @Test
    void updateBookingStatusPersistsNoteWhenProvided() {
        User admin = new User();
        admin.setId("admin-id");
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        Booking booking = new Booking();
        booking.setId("booking-1");
        booking.setUserId("user-1");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setNote("Old note");

        UpdateBookingStatusRequest request = new UpdateBookingStatusRequest();
        request.setStatus(BookingStatus.CHECKED_IN);
        request.setNote("  Guest da check-in luc 14:00  ");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(booking)).thenReturn(booking);

        Booking updated = bookingService.updateBookingStatus("booking-1", "admin@example.com", request);

        assertEquals(BookingStatus.CHECKED_IN, updated.getStatus());
        assertEquals("Guest da check-in luc 14:00", updated.getNote());
        verify(bookingRepository).save(booking);
    }

    @Test
    void getBookingsByRoomFailsWhenUserIsNotAdmin() {
        User user = new User();
        user.setId("user-id");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> bookingService.getBookingsByRoom("room-1", "user@example.com"));

        assertEquals("Ban khong co quyen xem booking theo room", ex.getMessage());
        verify(bookingRepository, never()).findByRoomId(anyString());
    }

    @Test
    void getTotalRevenueFailsWhenUserIsNotAdmin() {
        User user = new User();
        user.setId("user-id");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> bookingService.getTotalRevenue("user@example.com"));

        assertEquals("Ban khong co quyen xem doanh thu he thong", ex.getMessage());
        verify(bookingRepository, never()).findAll();
    }
}
