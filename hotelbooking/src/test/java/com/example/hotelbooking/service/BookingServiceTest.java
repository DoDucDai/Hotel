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

import com.example.hotelbooking.model.Booking;
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
}
