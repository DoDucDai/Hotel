package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
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
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class HostHotelServiceTest {

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

    private HostHotelService hostHotelService;

    @BeforeEach
    void setUp() {
        hostHotelService = new HostHotelService(
                hostAccessService,
                hotelRepository,
                roomRepository,
                bookingRepository,
                roomInventoryService,
                auditLogService,
                uploadStorageService);
    }

    @Test
    void deleteHotelFailsWhenAnyRoomHasActiveOrUpcomingBooking() {
        User host = buildHost();
        Hotel hotel = buildHotel("hotel-1", "host-1");
        Room room = buildRoom("room-1", "hotel-1");
        Booking activeBooking = buildBooking(BookingStatus.CONFIRMED, LocalDate.now().plusDays(1));

        when(hostAccessService.requireNonBlank("hotel-1", "Hotel id is required")).thenReturn("hotel-1");
        when(hostAccessService.requireCurrentUser("host@example.com")).thenReturn(host);
        when(hotelRepository.findById("hotel-1")).thenReturn(Optional.of(hotel));
        when(roomRepository.findByHotelId("hotel-1")).thenReturn(List.of(room));
        when(bookingRepository.findByRoomIdIn(anyList())).thenReturn(List.of(activeBooking));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> hostHotelService.deleteHotel("hotel-1", "host@example.com"));

        assertEquals("Khong the xoa khach san vi van con booking dang hoat dong hoac sap toi", ex.getMessage());
        verify(roomRepository, never()).deleteAll(List.of(room));
        verify(hotelRepository, never()).deleteById("hotel-1");
    }

    @Test
    void deleteHotelAllowsWhenOnlyCancelledOrPastBookings() {
        User host = buildHost();
        Hotel hotel = buildHotel("hotel-1", "host-1");
        Room room = buildRoom("room-1", "hotel-1");
        Booking cancelledFuture = buildBooking(BookingStatus.CANCELLED, LocalDate.now().plusDays(3));
        Booking confirmedPast = buildBooking(BookingStatus.CONFIRMED, LocalDate.now().minusDays(1));

        when(hostAccessService.requireNonBlank("hotel-1", "Hotel id is required")).thenReturn("hotel-1");
        when(hostAccessService.requireCurrentUser("host@example.com")).thenReturn(host);
        when(hotelRepository.findById("hotel-1")).thenReturn(Optional.of(hotel));
        when(roomRepository.findByHotelId("hotel-1")).thenReturn(List.of(room));
        when(bookingRepository.findByRoomIdIn(anyList())).thenReturn(List.of(cancelledFuture, confirmedPast));

        Map<String, String> result = hostHotelService.deleteHotel("hotel-1", "host@example.com");

        assertEquals("Hotel deleted", result.get("message"));
        verify(roomInventoryService).deleteBlocksByRoomId("room-1");
        verify(roomRepository).deleteAll(List.of(room));
        verify(hotelRepository).deleteById("hotel-1");
    }

    private User buildHost() {
        User user = new User();
        user.setId("host-1");
        user.setEmail("host@example.com");
        user.setRole(Role.USER);
        return user;
    }

    private Hotel buildHotel(String id, String ownerId) {
        Hotel hotel = new Hotel();
        hotel.setId(id);
        hotel.setOwnerId(ownerId);
        return hotel;
    }

    private Room buildRoom(String id, String hotelId) {
        Room room = new Room();
        room.setId(id);
        room.setHotelId(hotelId);
        return room;
    }

    private Booking buildBooking(BookingStatus status, LocalDate checkOutDate) {
        Booking booking = new Booking();
        booking.setStatus(status);
        booking.setCheckOutDate(checkOutDate);
        return booking;
    }
}
