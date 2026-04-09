package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomInventoryService roomInventoryService;

    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomService = new RoomService(roomRepository, hotelRepository, roomInventoryService);
    }

    @Test
    void getRoomByIdThrowsNotFoundForPublicWhenHotelIsNotApproved() {
        Room room = buildRoom("room-1", "hotel-pending", 1_000_000d);
        Hotel pendingHotel = buildHotel("hotel-pending", HotelApprovalStatus.PENDING);

        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));
        when(hotelRepository.findById("hotel-pending")).thenReturn(Optional.of(pendingHotel));

        assertThrows(NotFoundException.class, () -> roomService.getRoomById("room-1", false));
    }

    @Test
    void getRoomByIdAllowsAdminViewWhenHotelIsNotApproved() {
        Room room = buildRoom("room-1", "hotel-pending", 1_000_000d);
        when(roomRepository.findById("room-1")).thenReturn(Optional.of(room));

        Room result = roomService.getRoomById("room-1", true);

        assertNotNull(result);
        assertEquals("room-1", result.getId());
    }

    @Test
    void searchRoomsForPublicOnlyReturnsRoomsFromApprovedHotels() {
        Room approvedRoom = buildRoom("room-approved", "hotel-approved", 900_000d);
        Room pendingRoom = buildRoom("room-pending", "hotel-pending", 1_200_000d);

        Hotel approvedHotel = buildHotel("hotel-approved", HotelApprovalStatus.APPROVED);
        Hotel pendingHotel = buildHotel("hotel-pending", HotelApprovalStatus.PENDING);

        when(roomRepository.findByCapacityGreaterThanEqual(1)).thenReturn(List.of(approvedRoom, pendingRoom));
        when(hotelRepository.findById("hotel-approved")).thenReturn(Optional.of(approvedHotel));
        when(hotelRepository.findById("hotel-pending")).thenReturn(Optional.of(pendingHotel));

        List<Room> result = roomService.searchRooms(
                null,
                null,
                1,
                null,
                null,
                null,
                "price_asc",
                false);

        assertEquals(1, result.size());
        assertEquals("room-approved", result.get(0).getId());
    }

    private Room buildRoom(String id, String hotelId, double price) {
        Room room = new Room();
        room.setId(id);
        room.setHotelId(hotelId);
        room.setName("Room " + id);
        room.setCapacity(2);
        room.setPrice(price);
        room.setTotalUnits(2);
        room.setAmenities(List.of("wifi"));
        return room;
    }

    private Hotel buildHotel(String id, HotelApprovalStatus status) {
        Hotel hotel = new Hotel();
        hotel.setId(id);
        hotel.setApprovalStatus(status);
        return hotel;
    }
}
