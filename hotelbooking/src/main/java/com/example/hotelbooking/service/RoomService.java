package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.RoomDTO;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.mapper.RoomMapper;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class RoomService {

    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final RoomInventoryService roomInventoryService;

    public RoomService(
            RoomRepository roomRepository,
            HotelRepository hotelRepository,
            RoomInventoryService roomInventoryService) {
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.roomInventoryService = roomInventoryService;
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }

    public Page<RoomDTO> getAllRooms(Pageable pageable) {
        return getAllRooms(pageable, true);
    }

    public Page<RoomDTO> getAllRooms(Pageable pageable, boolean includeUnapproved) {
        Pageable safePageable = Objects.requireNonNull(pageable, "Pageable is required");
        if (includeUnapproved) {
            return roomRepository.findAll(safePageable).map(this::toRoomDtoForCatalog);
        }

        List<Room> visibleRooms = filterPublicRooms(roomRepository.findAll());
        if (safePageable.isUnpaged()) {
            List<RoomDTO> content = visibleRooms.stream()
                    .map(this::toRoomDtoForCatalog)
                    .toList();
            return new PageImpl<>(Objects.requireNonNull(content), safePageable, visibleRooms.size());
        }

        int pageSize = Math.max(safePageable.getPageSize(), 1);
        int pageNumber = Math.max(safePageable.getPageNumber(), 0);
        int start = Math.min(pageNumber * pageSize, visibleRooms.size());
        int end = Math.min(start + pageSize, visibleRooms.size());

        List<RoomDTO> content = visibleRooms.subList(start, end).stream()
                .map(this::toRoomDtoForCatalog)
                .toList();
        return new PageImpl<>(Objects.requireNonNull(content), safePageable, visibleRooms.size());
    }

    public Room getRoomById(String id) {
        return getRoomById(id, true);
    }

    public Room getRoomById(String id, boolean includeUnapproved) {
        String roomId = requireNonBlank(id, "Room id is required");
        Room room = roomRepository.findById(Objects.requireNonNull(roomId))
                .orElseThrow(() -> new NotFoundException("Room not found"));

        if (!includeUnapproved && !isHotelApproved(room.getHotelId())) {
            throw new NotFoundException("Room not found");
        }

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
        return getRoomsByHotel(hotelId, true);
    }

    public List<Room> getRoomsByHotel(String hotelId, boolean includeUnapproved) {
        String normalizedHotelId = requireNonBlank(hotelId, "Hotel id is required");
        if (!includeUnapproved && !isHotelApproved(normalizedHotelId)) {
            return List.of();
        }

        return roomRepository.findByHotelId(normalizedHotelId)
                .stream()
                .peek((room) -> room.setAvailableUnits(Math.max(room.getTotalUnits(), 1)))
                .collect(Collectors.toList());
    }

    public List<Room> findAvailableRooms(LocalDate checkIn, LocalDate checkOut) {
        return findAvailableRooms(checkIn, checkOut, true);
    }

    public List<Room> findAvailableRooms(LocalDate checkIn, LocalDate checkOut, boolean includeUnapproved) {
        return searchRooms(checkIn, checkOut, 1, null, null, null, "availability_desc", includeUnapproved);
    }

    public List<Room> searchRooms(
            LocalDate checkIn,
            LocalDate checkOut,
            int guests,
            Double minPrice,
            Double maxPrice,
            String amenity,
            String sortBy) {
        return searchRooms(checkIn, checkOut, guests, minPrice, maxPrice, amenity, sortBy, true);
    }

    public List<Room> searchRooms(
            LocalDate checkIn,
            LocalDate checkOut,
            int guests,
            Double minPrice,
            Double maxPrice,
            String amenity,
            String sortBy,
            boolean includeUnapproved) {
        int safeGuests = Math.max(guests, 1);
        List<Room> rooms = roomRepository.findByCapacityGreaterThanEqual(safeGuests);
        List<Room> visibleRooms = includeUnapproved ? rooms : filterPublicRooms(rooms);

        List<Room> filtered = visibleRooms.stream()
                .peek((room) -> roomInventoryService.applyInventorySnapshot(room, checkIn, checkOut))
                .filter((room) -> room.getAvailableUnits() > 0)
                .filter((room) -> matchesPrice(room, minPrice, maxPrice))
                .filter((room) -> matchesAmenity(room, amenity))
                .sorted(resolveSort(sortBy))
                .toList();

        if (checkIn == null || checkOut == null || !checkOut.isAfter(checkIn)) {
            return filtered.stream()
                    .peek((room) -> room.setAvailableUnits(Math.max(room.getTotalUnits(), 1)))
                    .toList();
        }

        return filtered;
    }

    public List<Room> getRoomsByGuestCount(int guests) {
        return getRoomsByGuestCount(guests, true);
    }

    public List<Room> getRoomsByGuestCount(int guests, boolean includeUnapproved) {
        return searchRooms(null, null, guests, null, null, null, "price_asc", includeUnapproved);
    }

    public List<RoomInventoryDayDTO> getInventoryCalendar(String roomId, LocalDate startDate, LocalDate endDate) {
        return getInventoryCalendar(roomId, startDate, endDate, true);
    }

    public List<RoomInventoryDayDTO> getInventoryCalendar(
            String roomId,
            LocalDate startDate,
            LocalDate endDate,
            boolean includeUnapproved) {
        Room room = getRoomById(roomId, includeUnapproved);
        return roomInventoryService.buildInventoryCalendar(room, startDate, endDate);
    }

    private RoomDTO toRoomDtoForCatalog(Room room) {
        room.setAvailableUnits(Math.max(room.getTotalUnits(), 1));
        room.setBookedUnits(0);
        room.setBlockedUnits(0);
        return RoomMapper.toDTO(room);
    }

    private List<Room> filterPublicRooms(List<Room> rooms) {
        if (rooms == null || rooms.isEmpty()) {
            return List.of();
        }

        Map<String, Boolean> approvalCache = new HashMap<>();
        return rooms.stream()
                .filter(Objects::nonNull)
                .filter((room) -> {
                    String hotelId = trimToNull(room.getHotelId());
                    if (hotelId == null) {
                        return false;
                    }

                    return approvalCache.computeIfAbsent(hotelId, this::isHotelApproved);
                })
                .toList();
    }

    private boolean isHotelApproved(String hotelId) {
        String normalizedHotelId = trimToNull(hotelId);
        if (normalizedHotelId == null) {
            return false;
        }

        Hotel hotel = hotelRepository.findById(normalizedHotelId).orElse(null);
        return hotel != null && hotel.getApprovalStatus() == HotelApprovalStatus.APPROVED;
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

    private Comparator<Room> resolveSort(String sortBy) {
        String normalizedSort = sortBy == null ? "price_asc" : sortBy.trim().toLowerCase();

        if ("price_desc".equals(normalizedSort)) {
            return Comparator.comparingDouble(Room::getPrice).reversed();
        }

        if ("capacity_desc".equals(normalizedSort)) {
            return Comparator.comparingInt(Room::getCapacity).reversed();
        }

        if ("availability_desc".equals(normalizedSort)) {
            return Comparator.comparingInt(Room::getAvailableUnits).reversed()
                    .thenComparingDouble(Room::getPrice);
        }

        return Comparator.comparingDouble(Room::getPrice);
    }

    private boolean matchesPrice(Room room, Double minPrice, Double maxPrice) {
        double price = Math.max(room.getPrice(), 0);

        if (minPrice != null && Double.isFinite(minPrice) && price < Math.max(minPrice, 0)) {
            return false;
        }

        if (maxPrice != null && Double.isFinite(maxPrice) && price > Math.max(maxPrice, 0)) {
            return false;
        }

        return true;
    }

    private boolean matchesAmenity(Room room, String amenity) {
        String normalizedAmenity = trimToNull(amenity);
        if (normalizedAmenity == null || "all".equalsIgnoreCase(normalizedAmenity)) {
            return true;
        }

        String keyword = normalizedAmenity.toLowerCase();
        return room.getAmenities().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .map(String::toLowerCase)
                .anyMatch((value) -> value.equals(keyword));
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
