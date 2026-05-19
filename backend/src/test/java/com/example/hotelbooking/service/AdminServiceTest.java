package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
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

import com.example.hotelbooking.dto.AdminDashboardDTO;
import com.example.hotelbooking.dto.UpdateHotelApprovalRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private DisputeService disputeService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    private AdminService adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminService(
                userRepository,
                hotelRepository,
                roomRepository,
                bookingRepository,
                disputeService,
                auditLogService,
                notificationService);
    }

    @Test
    void getDashboardAggregatesCountsAndRevenue() {
        Booking paidBooking = new Booking();
        paidBooking.setFinalPrice(1_000_000);
        paidBooking.setRefundAmount(100_000);

        Booking legacyBooking = new Booking();
        legacyBooking.setFinalPrice(0);
        legacyBooking.setTotalPrice(500_000);
        legacyBooking.setRefundAmount(0);

        Booking overRefundedBooking = new Booking();
        overRefundedBooking.setFinalPrice(100_000);
        overRefundedBooking.setRefundAmount(250_000);

        when(userRepository.count()).thenReturn(5L);
        when(hotelRepository.count()).thenReturn(3L);
        when(roomRepository.count()).thenReturn(12L);
        when(bookingRepository.count()).thenReturn(7L);
        when(bookingRepository.findAll()).thenReturn(List.of(paidBooking, legacyBooking, overRefundedBooking));

        AdminDashboardDTO dto = adminService.getDashboard();

        assertEquals(5L, dto.getTotalUsers());
        assertEquals(3L, dto.getTotalHotels());
        assertEquals(12L, dto.getTotalRooms());
        assertEquals(7L, dto.getTotalBookings());
        assertEquals(1_400_000d, dto.getTotalRevenue(), 0.001d);
    }

    @Test
    void updateHotelApprovalApprovedSavesAuditAndOwnerNotification() {
        User admin = new User();
        admin.setId("admin-1");
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        Hotel hotel = new Hotel();
        hotel.setId("hotel-1");
        hotel.setName("Happy Stay");
        hotel.setOwnerId("host-1");
        hotel.setApprovalStatus(HotelApprovalStatus.PENDING);

        UpdateHotelApprovalRequest request = new UpdateHotelApprovalRequest();
        request.setStatus(HotelApprovalStatus.APPROVED);
        request.setNote("Da dat dieu kien");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(hotelRepository.findById("hotel-1")).thenReturn(Optional.of(hotel));
        when(hotelRepository.save(any(Hotel.class))).thenAnswer((invocation) -> invocation.getArgument(0));

        Hotel saved = adminService.updateHotelApproval("hotel-1", request, "admin@example.com");

        assertEquals(HotelApprovalStatus.APPROVED, saved.getApprovalStatus());
        assertEquals("Da dat dieu kien", saved.getApprovalNote());
        assertEquals("admin-1", saved.getApprovedByUserId());
        assertNotNull(saved.getApprovedAt());

        verify(auditLogService).record(
                eq("HOTEL_APPROVAL"),
                eq("HOTEL"),
                eq("hotel-1"),
                eq(admin),
                eq("Cap nhat hotel sang APPROVED"));
        verify(notificationService).createForUser(
                eq("host-1"),
                eq("HOTEL_APPROVAL"),
                eq("Cap nhat duyet khach san"),
                eq("Hotel Happy Stay da duoc cap nhat trang thai: APPROVED"),
                eq("HOTEL"),
                eq("hotel-1"),
                eq(true));
    }

    @Test
    void updateHotelApprovalDefaultsPendingAndSkipsOwnerNotificationWhenNoOwner() {
        User admin = new User();
        admin.setId("admin-2");
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        Hotel hotel = new Hotel();
        hotel.setId("hotel-2");
        hotel.setName("No Owner Hotel");
        hotel.setOwnerId("   ");
        hotel.setApprovalStatus(HotelApprovalStatus.APPROVED);

        UpdateHotelApprovalRequest request = new UpdateHotelApprovalRequest();
        request.setStatus(null);
        request.setNote("   ");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(hotelRepository.findById("hotel-2")).thenReturn(Optional.of(hotel));
        when(hotelRepository.save(any(Hotel.class))).thenAnswer((invocation) -> invocation.getArgument(0));

        Hotel saved = adminService.updateHotelApproval("hotel-2", request, "admin@example.com");

        assertEquals(HotelApprovalStatus.PENDING, saved.getApprovalStatus());
        assertNull(saved.getApprovalNote());
        assertNull(saved.getApprovedAt());
        verify(notificationService, never()).createForUser(
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyString(),
                anyBoolean());
    }
}
