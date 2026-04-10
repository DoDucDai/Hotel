package com.example.hotelbooking.service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class HostHotelService {

    private final HostAccessService hostAccessService;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;
    private final RoomInventoryService roomInventoryService;
    private final AuditLogService auditLogService;
    private final UploadStorageService uploadStorageService;

    public HostHotelService(
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

    public List<Hotel> getMyHotels(String email) {
        User user = hostAccessService.requireCurrentUser(email);
        if (hostAccessService.isAdmin(user)) {
            return hotelRepository.findAll();
        }

        return hotelRepository.findByOwnerId(hostAccessService.requireUserId(user));
    }

    public Hotel createHotel(Hotel hotel, String email) {
        if (hotel == null) {
            throw new BadRequestException("Hotel payload is required");
        }

        Hotel payload = hotel;
        User user = hostAccessService.requireCurrentUser(email);
        hostAccessService.assertEmailVerifiedForAction(user, "dang phong");
        validateHotelInput(payload);

        Hotel newHotel = new Hotel();
        newHotel.setName(payload.getName().trim());
        newHotel.setAddress(payload.getAddress().trim());
        newHotel.setCity(payload.getCity().trim());
        newHotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        newHotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        newHotel.setOwnerId(hostAccessService.requireUserId(user));
        newHotel.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        newHotel.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyHotelImages(newHotel, payload);
        newHotel.setApprovalStatus(hostAccessService.isAdmin(user) ? HotelApprovalStatus.APPROVED : HotelApprovalStatus.PENDING);
        newHotel.setApprovalNote(
                hostAccessService.isAdmin(user)
                        ? "Duoc tao boi admin"
                        : "Dang cho admin duyet truoc khi hien thi cong khai");
        newHotel.setApprovedAt(hostAccessService.isAdmin(user) ? LocalDateTime.now() : null);
        newHotel.setApprovedByUserId(hostAccessService.isAdmin(user) ? user.getId() : null);

        Hotel savedHotel = hotelRepository.save(newHotel);
        auditLogService.record("CREATE_HOTEL", "HOTEL", savedHotel.getId(), user, "Host tao hotel moi");
        return savedHotel;
    }

    public Hotel updateHotel(String hotelId, Hotel updatedHotel, String email) {
        String normalizedHotelId = hostAccessService.requireNonBlank(hotelId, "Hotel id is required");
        if (updatedHotel == null) {
            throw new BadRequestException("Hotel payload is required");
        }

        Hotel payload = updatedHotel;

        User user = hostAccessService.requireCurrentUser(email);
        Hotel hotel = hotelRepository.findById(normalizedHotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hostAccessService.assertHotelOwner(user, hotel);
        validateHotelInput(payload);

        hotel.setName(payload.getName().trim());
        hotel.setAddress(payload.getAddress().trim());
        hotel.setCity(payload.getCity().trim());
        hotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        hotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        hotel.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        hotel.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyHotelImages(hotel, payload);

        if (!hostAccessService.isAdmin(user)) {
            hotel.setApprovalStatus(HotelApprovalStatus.PENDING);
            hotel.setApprovalNote("Host vua cap nhat. Can admin duyet lai");
            hotel.setApprovedAt(null);
            hotel.setApprovedByUserId(null);
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record("UPDATE_HOTEL", "HOTEL", savedHotel.getId(), user, "Cap nhat hotel");
        return savedHotel;
    }

    public Map<String, String> deleteHotel(String hotelId, String email) {
        String normalizedHotelId = hostAccessService.requireNonBlank(hotelId, "Hotel id is required");
        User user = hostAccessService.requireCurrentUser(email);
        Hotel hotel = hotelRepository.findById(normalizedHotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hostAccessService.assertHotelOwner(user, hotel);

        List<Room> rooms = roomRepository.findByHotelId(normalizedHotelId);
        if (hasActiveOrUpcomingBookings(rooms)) {
            throw new BadRequestException("Khong the xoa khach san vi van con booking dang hoat dong hoac sap toi");
        }

        if (!rooms.isEmpty()) {
            rooms.forEach((room) -> roomInventoryService.deleteBlocksByRoomId(room.getId()));
            roomRepository.deleteAll(rooms);
        }

        hotelRepository.deleteById(normalizedHotelId);
        auditLogService.record("DELETE_HOTEL", "HOTEL", normalizedHotelId, user, "Xoa hotel");
        return Map.of("message", "Hotel deleted");
    }

    public Hotel uploadHotelImages(String hotelId, MultipartFile[] files, String email) throws IOException {
        String normalizedHotelId = hostAccessService.requireNonBlank(hotelId, "Hotel id is required");
        User user = hostAccessService.requireCurrentUser(email);
        Hotel hotel = hotelRepository.findById(normalizedHotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hostAccessService.assertHotelOwner(user, hotel);

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(hotel.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        hotel.setImageUrls(mergedImages);

        Hotel savedHotel = hotelRepository.save(hotel);
        auditLogService.record("UPLOAD_HOTEL_IMAGES", "HOTEL", savedHotel.getId(), user, "Them gallery anh hotel");
        return savedHotel;
    }

    private void validateHotelInput(Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            throw new BadRequestException("Hotel name is required");
        }

        if (hotel.getAddress() == null || hotel.getAddress().isBlank()) {
            throw new BadRequestException("Hotel address is required");
        }

        if (hotel.getCity() == null || hotel.getCity().isBlank()) {
            throw new BadRequestException("Hotel city is required");
        }

        if (hotel.getStarRating() < 1 || hotel.getStarRating() > 5) {
            throw new BadRequestException("Star rating phai tu 1 den 5");
        }
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

    private void applyHotelImages(Hotel targetHotel, Hotel payloadHotel) {
        if (targetHotel == null || payloadHotel == null || !hasHotelImages(payloadHotel)) {
            return;
        }

        targetHotel.setImageUrls(payloadHotel.getImageUrls());
        if (hasText(payloadHotel.getImageUrl())) {
            targetHotel.setImageUrl(payloadHotel.getImageUrl());
        }
    }

    private boolean hasHotelImages(Hotel hotel) {
        if (hotel == null) {
            return false;
        }

        List<String> imageUrls = hotel.getImageUrls() == null ? List.of() : hotel.getImageUrls();
        return hasText(hotel.getImageUrl())
                || imageUrls.stream().anyMatch(this::hasText);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean hasActiveOrUpcomingBookings(List<Room> rooms) {
        if (rooms == null || rooms.isEmpty()) {
            return false;
        }

        Set<String> roomIds = rooms.stream()
                .filter(Objects::nonNull)
                .map(Room::getId)
                .filter(Objects::nonNull)
                .filter((value) -> !value.isBlank())
                .collect(Collectors.toSet());

        if (roomIds.isEmpty()) {
            return false;
        }

        LocalDate today = LocalDate.now();
        return bookingRepository.findByRoomIdIn(List.copyOf(roomIds)).stream()
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
