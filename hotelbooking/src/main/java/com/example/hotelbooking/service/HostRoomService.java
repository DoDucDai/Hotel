package com.example.hotelbooking.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class HostRoomService {

    private final HostAccessService hostAccessService;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final RoomInventoryService roomInventoryService;
    private final AuditLogService auditLogService;
    private final UploadStorageService uploadStorageService;

    public HostRoomService(
            HostAccessService hostAccessService,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository,
            RoomInventoryService roomInventoryService,
            AuditLogService auditLogService,
            UploadStorageService uploadStorageService) {
        this.hostAccessService = hostAccessService;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
        this.roomInventoryService = roomInventoryService;
        this.auditLogService = auditLogService;
        this.uploadStorageService = uploadStorageService;
    }

    public List<Room> getMyRooms(String email) {
        User user = hostAccessService.requireCurrentUser(email);
        if (hostAccessService.isAdmin(user)) {
            return roomRepository.findAll();
        }

        return roomRepository.findByOwnerId(hostAccessService.requireUserId(user));
    }

    public Room createRoom(Room room, String email) {
        if (room == null) {
            throw new BadRequestException("Room payload is required");
        }

        Room payload = room;
        User user = hostAccessService.requireCurrentUser(email);
        validateRoomInput(payload);

        String hotelId = hostAccessService.requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hostAccessService.assertHotelOwner(user, hotel);

        Room newRoom = new Room();
        newRoom.setOwnerId(hostAccessService.requireUserId(user));
        newRoom.setHotelId(hotel.getId());
        newRoom.setName(payload.getName().trim());
        newRoom.setCapacity(payload.getCapacity());
        newRoom.setPrice(payload.getPrice());
        newRoom.setRoomType(trimToNull(payload.getRoomType()) == null ? "STANDARD" : payload.getRoomType().trim());
        newRoom.setBedType(trimToNull(payload.getBedType()));
        newRoom.setDescription(trimToNull(payload.getDescription()));
        applyRoomImages(newRoom, payload);
        newRoom.setTotalUnits(Math.max(payload.getTotalUnits(), 1));
        newRoom.setAmenities(normalizeAmenities(payload.getAmenities()));

        Room savedRoom = roomRepository.save(newRoom);
        auditLogService.record("CREATE_ROOM", "ROOM", savedRoom.getId(), user, "Host tao loai phong moi");
        return savedRoom;
    }

    public Room updateRoom(String roomId, Room updatedRoom, String email) {
        String normalizedRoomId = hostAccessService.requireNonBlank(roomId, "Room id is required");
        if (updatedRoom == null) {
            throw new BadRequestException("Room payload is required");
        }

        Room payload = updatedRoom;
        User user = hostAccessService.requireCurrentUser(email);
        validateRoomInput(payload);

        Room room = roomRepository.findById(normalizedRoomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        if (!hostAccessService.isAdmin(user) && !hostAccessService.requireUserId(user).equals(room.getOwnerId())) {
            throw new ForbiddenException("You do not have permission to update this room");
        }

        String hotelId = hostAccessService.requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hostAccessService.assertHotelOwner(user, hotel);

        room.setHotelId(hotel.getId());
        room.setName(payload.getName().trim());
        room.setCapacity(payload.getCapacity());
        room.setPrice(payload.getPrice());
        room.setRoomType(trimToNull(payload.getRoomType()) == null ? "STANDARD" : payload.getRoomType().trim());
        room.setBedType(trimToNull(payload.getBedType()));
        room.setDescription(trimToNull(payload.getDescription()));
        applyRoomImages(room, payload);
        room.setTotalUnits(Math.max(payload.getTotalUnits(), 1));
        room.setAmenities(normalizeAmenities(payload.getAmenities()));

        Room savedRoom = roomRepository.save(room);
        auditLogService.record("UPDATE_ROOM", "ROOM", savedRoom.getId(), user, "Host cap nhat loai phong");
        return savedRoom;
    }

    public Map<String, String> deleteRoom(String roomId, String email) {
        String normalizedRoomId = hostAccessService.requireNonBlank(roomId, "Room id is required");
        User user = hostAccessService.requireCurrentUser(email);
        Room room = roomRepository.findById(normalizedRoomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        if (!hostAccessService.isAdmin(user) && !hostAccessService.requireUserId(user).equals(room.getOwnerId())) {
            throw new ForbiddenException("You do not have permission to delete this room");
        }

        if (hasActiveOrUpcomingBookings(normalizedRoomId)) {
            throw new BadRequestException("Khong the xoa phong vi van con booking dang hoat dong hoac sap toi");
        }

        roomInventoryService.deleteBlocksByRoomId(normalizedRoomId);
        roomRepository.deleteById(normalizedRoomId);
        auditLogService.record("DELETE_ROOM", "ROOM", normalizedRoomId, user, "Host xoa loai phong");
        return Map.of("message", "Room deleted");
    }

    public Room uploadRoomImages(String roomId, MultipartFile[] files, String email) throws IOException {
        String normalizedRoomId = hostAccessService.requireNonBlank(roomId, "Room id is required");
        User user = hostAccessService.requireCurrentUser(email);
        Room room = roomRepository.findById(normalizedRoomId)
                .orElseThrow(() -> new NotFoundException("Room not found"));

        hostAccessService.assertRoomOwner(user, room);

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(room.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        room.setImageUrls(mergedImages);

        Room savedRoom = roomRepository.save(room);
        auditLogService.record("UPLOAD_ROOM_IMAGES", "ROOM", savedRoom.getId(), user, "Them gallery anh room");
        return savedRoom;
    }

    private void validateRoomInput(Room room) {
        if (room.getHotelId() == null || room.getHotelId().isBlank()) {
            throw new BadRequestException("hotelId is required");
        }

        if (room.getName() == null || room.getName().isBlank()) {
            throw new BadRequestException("Room name is required");
        }

        if (room.getCapacity() < 1) {
            throw new BadRequestException("Room capacity must be at least 1");
        }

        if (room.getPrice() < 0) {
            throw new BadRequestException("Room price must be non-negative");
        }

        if (room.getTotalUnits() < 1) {
            throw new BadRequestException("Tong so phong phai lon hon hoac bang 1");
        }
    }

    private List<String> normalizeAmenities(List<String> amenities) {
        if (amenities == null) {
            return List.of();
        }

        return amenities.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .collect(Collectors.toList());
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private void applyRoomImages(Room targetRoom, Room payloadRoom) {
        if (targetRoom == null || payloadRoom == null || !hasRoomImages(payloadRoom)) {
            return;
        }

        targetRoom.setImageUrls(payloadRoom.getImageUrls());
        if (hasText(payloadRoom.getImageUrl())) {
            targetRoom.setImageUrl(payloadRoom.getImageUrl());
        }
    }

    private boolean hasRoomImages(Room room) {
        if (room == null) {
            return false;
        }

        List<String> imageUrls = room.getImageUrls() == null ? List.of() : room.getImageUrls();
        return hasText(room.getImageUrl())
                || imageUrls.stream().anyMatch(this::hasText);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean hasActiveOrUpcomingBookings(String roomId) {
        LocalDate today = LocalDate.now();
        return bookingRepository.findByRoomId(roomId).stream()
                .filter(Objects::nonNull)
                .filter((booking) -> booking.getStatus() != BookingStatus.CANCELLED)
                .anyMatch((booking) -> {
                    if (booking.getCheckOutDate() == null) {
                        return true;
                    }

                    return !booking.getCheckOutDate().isBefore(today);
                });
    }
}
