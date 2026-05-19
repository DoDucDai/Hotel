package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class HostRoomServiceTest {

    @Mock
    private HostAccessService hostAccessService;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomInventoryService roomInventoryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private UploadStorageService uploadStorageService;

    private HostRoomService hostRoomService;

    @BeforeEach
    void setUp() {
        hostRoomService = new HostRoomService(
                hostAccessService,
                hotelRepository,
                roomRepository,
                bookingRepository,
                roomInventoryService,
                auditLogService,
                uploadStorageService);
    }

    @Test
    void deleteRoomFailsWhenActiveOrUpcomingBookingsExist() {
        User host = buildHost();
        Room room = buildRoom("room-1", "host-1");
        Booking activeBooking = buildBooking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(2));

        when(hostAccessService.requireNonBlank("room-1", "Room id is required")).thenReturn("room-1");
        when(hostAccessService.requireCurrentUser("host@example.com")).thenReturn(host);
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(hostAccessService.isAdmin(host)).thenReturn(false);
        when(hostAccessService.requireUserId(host)).thenReturn("host-1");
        when(bookingRepository.findByRoomId("room-1")).thenReturn(List.of(activeBooking));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> hostRoomService.deleteRoom("room-1", "host@example.com"));

        assertEquals("Khong the xoa phong vi van con booking dang hoat dong hoac sap toi", ex.getMessage());
        verify(roomInventoryService, never()).deleteBlocksByRoomId("room-1");
        verify(roomRepository, never()).deleteById("room-1");
    }

    @Test
    void deleteRoomAllowsWhenOnlyCancelledOrPastBookings() {
        User host = buildHost();
        Room room = buildRoom("room-1", "host-1");
        Booking cancelledFuture = buildBooking(BookingStatus.CANCELLED, LocalDate.now().plusDays(3));
        Booking confirmedPast = buildBooking(BookingStatus.CONFIRMED, LocalDate.now().minusDays(1));

        when(hostAccessService.requireNonBlank("room-1", "Room id is required")).thenReturn("room-1");
        when(hostAccessService.requireCurrentUser("host@example.com")).thenReturn(host);
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(hostAccessService.isAdmin(host)).thenReturn(false);
        when(hostAccessService.requireUserId(host)).thenReturn("host-1");
        when(bookingRepository.findByRoomId("room-1")).thenReturn(List.of(cancelledFuture, confirmedPast));

        Map<String, String> result = hostRoomService.deleteRoom("room-1", "host@example.com");

        assertEquals("Room deleted", result.get("message"));
        verify(roomInventoryService).deleteBlocksByRoomId("room-1");
        verify(roomRepository).deleteById("room-1");
    }

    @Test
    void createRoomFailsWhenEmailNotVerified() {
        User host = buildHost();
        Room payload = new Room();
        payload.setHotelId("hotel-1");
        payload.setName("Deluxe");
        payload.setCapacity(2);
        payload.setPrice(1000000);
        payload.setTotalUnits(1);

        when(hostAccessService.requireCurrentUser("host@example.com")).thenReturn(host);
        doThrow(new ForbiddenException("Email chua duoc xac nhan. Vui long xac nhan email truoc khi dang phong"))
                .when(hostAccessService)
                .assertEmailVerifiedForAction(host, "dang phong");

        ForbiddenException ex = assertThrows(
                ForbiddenException.class,
                () -> hostRoomService.createRoom(payload, "host@example.com"));

        assertEquals("Email chua duoc xac nhan. Vui long xac nhan email truoc khi dang phong", ex.getMessage());
        verify(roomRepository, never()).save(any(Room.class));
    }

    private User buildHost() {
        User user = new User();
        user.setId("host-1");
        user.setEmail("host@example.com");
        user.setRole(Role.USER);
        return user;
    }

    private Room buildRoom(String id, String ownerId) {
        Room room = new Room();
        room.setId(id);
        room.setOwnerId(ownerId);
        return room;
    }

    private Booking buildBooking(BookingStatus status, LocalDate checkOutDate) {
        Booking booking = new Booking();
        booking.setStatus(status);
        booking.setCheckOutDate(checkOutDate);
        return booking;
    }
}
