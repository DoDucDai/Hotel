package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.dto.RoomDTO;
import com.example.hotelbooking.mapper.RoomMapper;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private RoomInventoryService roomInventoryService;

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    public Page<RoomDTO> getAllRooms(Pageable pageable) {
        Pageable safePageable = Objects.requireNonNull(pageable, "Pageable is required");
        return roomRepository.findAll(safePageable)
                .map((room) -> {
                    room.setAvailableUnits(Math.max(room.getTotalUnits(), 1));
                    room.setBookedUnits(0);
                    room.setBlockedUnits(0);
                    return RoomMapper.toDTO(room);
                });
    }

    public Room getRoomById(String id) {
        String roomId = requireNonBlank(id, "Room id is required");
        Room room = roomRepository.findById(Objects.requireNonNull(roomId))
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setAvailableUnits(Math.max(room.getTotalUnits(), 1));
        return room;
    }

    public Room createRoom(Room room) {
        Room roomToCreate = Objects.requireNonNull(room, "Room is required");
        normalizeRoom(roomToCreate);
        return roomRepository.save(roomToCreate);
    }

    public Room updateRoom(String id, Room room) {
        String roomId = requireNonBlank(id, "Room id is required");
        Room roomToUpdate = Objects.requireNonNull(room, "Room is required");
        roomToUpdate.setId(roomId);
        normalizeRoom(roomToUpdate);
        return roomRepository.save(roomToUpdate);
    }

    public void deleteRoom(String id) {
        String roomId = requireNonBlank(id, "Room id is required");
        roomRepository.deleteById(Objects.requireNonNull(roomId));
    }

    public List<Room> getRoomsByHotel(String hotelId) {
        String normalizedHotelId = requireNonBlank(hotelId, "Hotel id is required");
        return roomRepository.findByHotelId(normalizedHotelId)
                .stream()
                .peek((room) -> room.setAvailableUnits(Math.max(room.getTotalUnits(), 1)))
                .collect(Collectors.toList());
    }

    public List<Room> findAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        List<Room> allRooms = roomRepository.findAll();
        return allRooms.stream()
                .peek((room) -> roomInventoryService.applyInventorySnapshot(room, checkIn, checkOut))
                .filter((room) -> room.getAvailableUnits() > 0)
                .toList();
    }

    public List<Room> searchRooms(LocalDate checkIn, LocalDate checkOut, int guests) {
        List<Room> rooms = roomRepository.findByCapacityGreaterThanEqual(guests);
        return rooms.stream()
                .peek((room) -> roomInventoryService.applyInventorySnapshot(room, checkIn, checkOut))
                .filter((room) -> room.getAvailableUnits() > 0)
                .toList();
    }

    public List<Room> getRoomsByGuestCount(int guests) {
        return roomRepository.findByCapacityGreaterThanEqual(guests)
                .stream()
                .peek((room) -> room.setAvailableUnits(Math.max(room.getTotalUnits(), 1)))
                .collect(Collectors.toList());
    }

    public List<RoomInventoryDayDTO> getInventoryCalendar(String roomId, LocalDate startDate, LocalDate endDate) {
        Room room = getRoomById(roomId);
        return roomInventoryService.buildInventoryCalendar(room, startDate, endDate);
    }

    private void normalizeRoom(Room room) {
        room.setRoomType(trimToNull(room.getRoomType()) == null ? "STANDARD" : room.getRoomType().trim());
        room.setBedType(trimToNull(room.getBedType()));
        room.setDescription(trimToNull(room.getDescription()));
        room.setTotalUnits(Math.max(room.getTotalUnits(), 1));
        room.setAmenities(room.getAmenities().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .distinct()
                .toList());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}

