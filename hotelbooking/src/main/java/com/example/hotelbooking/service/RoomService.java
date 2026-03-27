package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.RoomDTO;
import com.example.hotelbooking.mapper.RoomMapper;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    public Page<RoomDTO> getAllRooms(Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "Pageable is required");
        return roomRepository.findAll(safePageable)
                .map(RoomMapper::toDTO);
    }

    public Room getRoomById(String id) {
        String roomId = requireNonBlank(id, "Room id is required");
        return roomRepository.findById(Objects.requireNonNull(roomId))
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    public Room createRoom(Room room) {
        Room roomToCreate = Objects.requireNonNull(room, "Room is required");
        return roomRepository.save(roomToCreate);
    }

    public Room updateRoom(String id, Room room) {
        String roomId = requireNonBlank(id, "Room id is required");
        Room roomToUpdate = Objects.requireNonNull(room, "Room is required");
        roomToUpdate.setId(roomId);
        return roomRepository.save(roomToUpdate);
    }

    public void deleteRoom(String id) {
        String roomId = requireNonBlank(id, "Room id is required");
        roomRepository.deleteById(Objects.requireNonNull(roomId));
    }

    public List<Room> getRoomsByHotel(String hotelId) {
        String normalizedHotelId = requireNonBlank(hotelId, "Hotel id is required");
        return roomRepository.findByHotelId(normalizedHotelId);
    }

    public List<Room> findAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        List<Room> allRooms = roomRepository.findAll();

        List<Booking> bookings = bookingRepository
                .findByCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(checkOut, checkIn);

        List<String> bookedRoomIds = bookings.stream()
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .map(Booking::getRoomId)
                .toList();

        return allRooms.stream()
                .filter(room -> !bookedRoomIds.contains(room.getId()))
                .toList();
    }

    public List<Room> searchRooms(LocalDate checkIn, LocalDate checkOut, int guests) {
        List<Room> rooms = roomRepository.findByCapacityGreaterThanEqual(guests);

        List<Booking> bookings = bookingRepository
                .findByCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(checkOut, checkIn);

        List<String> bookedRoomIds = bookings.stream()
                .filter(booking -> booking.getStatus() != BookingStatus.CANCELLED)
                .map(Booking::getRoomId)
                .toList();

        return rooms.stream()
                .filter(room -> !bookedRoomIds.contains(room.getId()))
                .toList();
    }

    public List<Room> getRoomsByGuestCount(int guests) {
        return roomRepository.findByCapacityGreaterThanEqual(guests);
    }
}

