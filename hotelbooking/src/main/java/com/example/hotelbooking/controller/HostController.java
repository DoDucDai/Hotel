package com.example.hotelbooking.controller;

import java.io.IOException;
import java.util.ArrayList;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.dto.InventoryBlockRequest;
import com.example.hotelbooking.dto.RoomInventoryDayDTO;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.RoomInventoryBlock;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.service.AuditLogService;
import com.example.hotelbooking.service.RoomInventoryService;
import com.example.hotelbooking.service.UploadStorageService;

@RestController
@RequestMapping("/host")
@SuppressWarnings("null")
public class HostController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final RoomInventoryService roomInventoryService;
    private final AuditLogService auditLogService;
    private final UploadStorageService uploadStorageService;

    public HostController(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            RoomInventoryService roomInventoryService,
            AuditLogService auditLogService,
            UploadStorageService uploadStorageService) {
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.roomInventoryService = roomInventoryService;
        this.auditLogService = auditLogService;
        this.uploadStorageService = uploadStorageService;
    }

    @GetMapping("/hotels/my")
    public List<Hotel> getMyHotels(Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (isAdmin(user)) {
            return hotelRepository.findAll();
        }

        return hotelRepository.findByOwnerId(requireUserId(user));
    }

    @PostMapping("/hotels")
    public Hotel createHotel(@RequestBody Hotel hotel, Authentication authentication) {
        Hotel payload = Objects.requireNonNull(hotel, "Hotel payload is required");
        User user = getCurrentUser(authentication);
        validateHotelInput(payload);

        Hotel newHotel = new Hotel();
        newHotel.setName(payload.getName().trim());
        newHotel.setAddress(payload.getAddress().trim());
        newHotel.setCity(payload.getCity().trim());
        newHotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        newHotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        newHotel.setOwnerId(requireUserId(user));
        newHotel.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        newHotel.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyHotelImages(newHotel, payload);
        newHotel.setApprovalStatus(isAdmin(user) ? HotelApprovalStatus.APPROVED : HotelApprovalStatus.PENDING);
        newHotel.setApprovalNote(
                isAdmin(user)
                        ? "Duoc tao boi admin"
                        : "Dang cho admin duyet truoc khi hien thi cong khai");
        newHotel.setApprovedAt(isAdmin(user) ? LocalDateTime.now() : null);
        newHotel.setApprovedByUserId(isAdmin(user) ? user.getId() : null);

        Hotel savedHotel = hotelRepository.save(newHotel);
        auditLogService.record("CREATE_HOTEL", "HOTEL", savedHotel.getId(), user, "Host tao hotel moi");
        return savedHotel;
    }

    @PutMapping("/hotels/{id}")
    public Hotel updateHotel(
            @PathVariable String id,
            @RequestBody Hotel updatedHotel,
            Authentication authentication) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel payload = Objects.requireNonNull(updatedHotel, "Hotel payload is required");

        User user = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);
        validateHotelInput(payload);

        hotel.setName(payload.getName().trim());
        hotel.setAddress(payload.getAddress().trim());
        hotel.setCity(payload.getCity().trim());
        hotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        hotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        hotel.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        hotel.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyHotelImages(hotel, payload);

        if (!isAdmin(user)) {
            hotel.setApprovalStatus(HotelApprovalStatus.PENDING);
            hotel.setApprovalNote("Host vua cap nhat. Can admin duyet lai");
            hotel.setApprovedAt(null);
            hotel.setApprovedByUserId(null);
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record("UPDATE_HOTEL", "HOTEL", savedHotel.getId(), user, "Cap nhat hotel");
        return savedHotel;
    }

    @DeleteMapping("/hotels/{id}")
    public Map<String, String> deleteHotel(
            @PathVariable String id,
            Authentication authentication) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        User user = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        List<Room> rooms = roomRepository.findByHotelId(hotelId);
        if (!rooms.isEmpty()) {
            rooms.forEach((room) -> roomInventoryService.deleteBlocksByRoomId(room.getId()));
            roomRepository.deleteAll(rooms);
        }

        hotelRepository.deleteById(hotelId);
        auditLogService.record("DELETE_HOTEL", "HOTEL", hotelId, user, "Xoa hotel");
        return Map.of("message", "Hotel deleted");
    }

    @PostMapping("/hotels/{id}/images")
    public Hotel uploadHotelImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) throws IOException {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        User user = getCurrentUser(authentication);
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(hotel.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        hotel.setImageUrls(mergedImages);

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record("UPLOAD_HOTEL_IMAGES", "HOTEL", savedHotel.getId(), user, "Them gallery anh hotel");
        return savedHotel;
    }

    @GetMapping("/rooms/my")
    public List<Room> getMyRooms(Authentication authentication) {
        User user = getCurrentUser(authentication);
        if (isAdmin(user)) {
            return roomRepository.findAll();
        }

        return roomRepository.findByOwnerId(requireUserId(user));
    }

    @PostMapping("/rooms")
    public Room createRoom(@RequestBody Room room, Authentication authentication) {
        Room payload = Objects.requireNonNull(room, "Room payload is required");
        User user = getCurrentUser(authentication);
        validateRoomInput(payload);

        String hotelId = requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

        Room newRoom = new Room();
        newRoom.setOwnerId(requireUserId(user));
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

    @PutMapping("/rooms/{id}")
    public Room updateRoom(
            @PathVariable String id,
            @RequestBody Room updatedRoom,
            Authentication authentication) {

        String roomId = requireNonBlank(id, "Room id is required");
        Room payload = Objects.requireNonNull(updatedRoom, "Room payload is required");
        User user = getCurrentUser(authentication);
        validateRoomInput(payload);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!isAdmin(user) && !requireUserId(user).equals(room.getOwnerId())) {
            throw new RuntimeException("You do not have permission to update this room");
        }

        String hotelId = requireNonBlank(payload.getHotelId(), "hotelId is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        assertHotelOwner(user, hotel);

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

    @DeleteMapping("/rooms/{id}")
    public Map<String, String> deleteRoom(
            @PathVariable String id,
            Authentication authentication) {

        String roomId = requireNonBlank(id, "Room id is required");
        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!isAdmin(user) && !requireUserId(user).equals(room.getOwnerId())) {
            throw new RuntimeException("You do not have permission to delete this room");
        }

        roomInventoryService.deleteBlocksByRoomId(roomId);
        roomRepository.deleteById(roomId);
        auditLogService.record("DELETE_ROOM", "ROOM", roomId, user, "Host xoa loai phong");
        return Map.of("message", "Room deleted");
    }

    @PostMapping("/rooms/{id}/images")
    public Room uploadRoomImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) throws IOException {

        String roomId = requireNonBlank(id, "Room id is required");
        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        assertRoomOwner(user, room);

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(room.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        room.setImageUrls(mergedImages);

        Room savedRoom = roomRepository.save(room);
        auditLogService.record("UPLOAD_ROOM_IMAGES", "ROOM", savedRoom.getId(), user, "Them gallery anh room");
        return savedRoom;
    }

    @GetMapping("/rooms/{roomId}/inventory")
    public List<RoomInventoryDayDTO> getRoomInventory(
            @PathVariable String roomId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new RuntimeException("Room not found"));
        assertRoomOwner(user, room);

        return roomInventoryService.buildInventoryCalendar(
                room,
                LocalDate.parse(startDate),
                LocalDate.parse(endDate));
    }

    @GetMapping("/rooms/{roomId}/inventory-blocks")
    public List<RoomInventoryBlock> getRoomInventoryBlocks(
            @PathVariable String roomId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new RuntimeException("Room not found"));
        assertRoomOwner(user, room);
        return roomInventoryService.getBlocksByRoomId(room.getId());
    }

    @PostMapping("/rooms/{roomId}/inventory-blocks")
    public RoomInventoryBlock createInventoryBlock(
            @PathVariable String roomId,
            @RequestBody InventoryBlockRequest request,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        Room room = roomRepository.findById(requireNonBlank(roomId, "Room id is required"))
                .orElseThrow(() -> new RuntimeException("Room not found"));
        assertRoomOwner(user, room);

        InventoryBlockRequest safeRequest = Objects.requireNonNull(request, "Inventory block request is required");
        LocalDate startDate = Objects.requireNonNull(safeRequest.getStartDate(), "Ngay bat dau la bat buoc");
        LocalDate endDate = Objects.requireNonNull(safeRequest.getEndDate(), "Ngay ket thuc la bat buoc");
        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("Ngay ket thuc block khong hop le");
        }

        int blockedUnits = Math.max(safeRequest.getBlockedUnits(), 1);
        if (blockedUnits > Math.max(room.getTotalUnits(), 1)) {
            throw new RuntimeException("So phong block vuot qua tong so luong phong");
        }

        RoomInventoryBlock block = new RoomInventoryBlock();
        block.setRoomId(room.getId());
        block.setStartDate(startDate);
        block.setEndDate(endDate);
        block.setBlockedUnits(blockedUnits);
        block.setReason(trimToNull(safeRequest.getReason()));
        block.setCreatedByUserId(user.getId());
        block.setCreatedAt(LocalDateTime.now());

        RoomInventoryBlock savedBlock = roomInventoryService.saveBlock(block);
        auditLogService.record("BLOCK_ROOM_INVENTORY", "ROOM", room.getId(), user, "Block ton kho theo ngay");
        return savedBlock;
    }

    @DeleteMapping("/inventory-blocks/{blockId}")
    public Map<String, String> deleteInventoryBlock(
            @PathVariable String blockId,
            Authentication authentication) {

        User user = getCurrentUser(authentication);
        RoomInventoryBlock block = roomInventoryService.getBlockById(blockId);
        Room room = roomRepository.findById(requireNonBlank(block.getRoomId(), "Room id is required"))
                .orElseThrow(() -> new RuntimeException("Room not found"));
        assertRoomOwner(user, room);

        roomInventoryService.deleteBlock(blockId);
        auditLogService.record("UNBLOCK_ROOM_INVENTORY", "ROOM", room.getId(), user, "Go block ton kho");
        return Map.of("message", "Inventory block deleted");
    }

    private void validateHotelInput(Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            throw new RuntimeException("Hotel name is required");
        }

        if (hotel.getAddress() == null || hotel.getAddress().isBlank()) {
            throw new RuntimeException("Hotel address is required");
        }

        if (hotel.getCity() == null || hotel.getCity().isBlank()) {
            throw new RuntimeException("Hotel city is required");
        }

        if (hotel.getStarRating() < 1 || hotel.getStarRating() > 5) {
            throw new RuntimeException("Star rating phai tu 1 den 5");
        }
    }

    private void validateRoomInput(Room room) {
        if (room.getHotelId() == null || room.getHotelId().isBlank()) {
            throw new RuntimeException("hotelId is required");
        }

        if (room.getName() == null || room.getName().isBlank()) {
            throw new RuntimeException("Room name is required");
        }

        if (room.getCapacity() < 1) {
            throw new RuntimeException("Room capacity must be at least 1");
        }

        if (room.getPrice() < 0) {
            throw new RuntimeException("Room price must be non-negative");
        }

        if (room.getTotalUnits() < 1) {
            throw new RuntimeException("Tong so phong phai lon hon hoac bang 1");
        }
    }

    private void assertHotelOwner(User user, Hotel hotel) {
        if (isAdmin(user)) {
            return;
        }

        if (hotel.getOwnerId() == null || !hotel.getOwnerId().equals(requireUserId(user))) {
            throw new RuntimeException("You do not have permission for this hotel");
        }
    }

    private void assertRoomOwner(User user, Room room) {
        if (isAdmin(user)) {
            return;
        }

        if (room.getOwnerId() == null || !room.getOwnerId().equals(requireUserId(user))) {
            throw new RuntimeException("You do not have permission for this room");
        }
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Unauthorized");
        }

        String email = requireNonBlank(authentication.getName(), "Unauthorized");

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    private String requireUserId(User user) {
        return requireNonBlank(user.getId(), "Current user id is missing");
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    private int normalizeStarRating(int starRating) {
        return starRating < 1 || starRating > 5 ? 3 : starRating;
    }

    private int clampPercent(int value) {
        return Math.min(Math.max(value, 0), 100);
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

    private void applyHotelImages(Hotel targetHotel, Hotel payloadHotel) {
        if (targetHotel == null || payloadHotel == null || !hasHotelImages(payloadHotel)) {
            return;
        }

        targetHotel.setImageUrls(payloadHotel.getImageUrls());
        if (hasText(payloadHotel.getImageUrl())) {
            targetHotel.setImageUrl(payloadHotel.getImageUrl());
        }
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

    private boolean hasHotelImages(Hotel hotel) {
        return hotel != null
                && (hasText(hotel.getImageUrl())
                || hotel.getImageUrls().stream().anyMatch(this::hasText));
    }

    private boolean hasRoomImages(Room room) {
        return room != null
                && (hasText(room.getImageUrl())
                || room.getImageUrls().stream().anyMatch(this::hasText));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

