package com.example.hotelbooking.controller;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.service.UploadStorageService;

@RestController
@RequestMapping("/hotels")
public class HotelController {

    private final HotelRepository hotelRepository;
    private final UploadStorageService uploadStorageService;

    public HotelController(HotelRepository hotelRepository, UploadStorageService uploadStorageService) {
        this.hotelRepository = hotelRepository;
        this.uploadStorageService = uploadStorageService;
    }

    @GetMapping
    public ResponseEntity<?> getHotels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        List<Hotel> publicHotels = hotelRepository.findAll()
                .stream()
                .filter(this::isPublicHotel)
                .sorted(Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int start = Math.min(safePage * safeSize, publicHotels.size());
        int end = Math.min(start + safeSize, publicHotels.size());
        List<Hotel> content = publicHotels.subList(start, end);
        int totalPages = publicHotels.isEmpty() ? 0 : (int) Math.ceil((double) publicHotels.size() / safeSize);

        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalPages", totalPages,
                "totalElements", publicHotels.size(),
                "currentPage", safePage
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHotelById(@PathVariable String id) {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        Optional<Hotel> optionalHotel = hotelRepository.findById(Objects.requireNonNull(hotelId));

        if (optionalHotel.isPresent() && isPublicHotel(optionalHotel.get())) {
            return ResponseEntity.ok(optionalHotel.get());
        }

        return ResponseEntity.status(404).body("Hotel not found");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createHotel(@RequestBody Hotel hotel) {
        if (hotel.getName() == null || hotel.getName().isBlank()) {
            return ResponseEntity.badRequest().body("Hotel name is required");
        }

        hotel.setStarRating(normalizeStarRating(hotel.getStarRating()));
        hotel.setAmenities(normalizeAmenities(hotel.getAmenities()));
        applyImagePayload(hotel, hotel);
        return ResponseEntity.ok(hotelRepository.save(hotel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHotel(
            @PathVariable String id,
            @RequestBody Hotel updatedHotel) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        Optional<Hotel> optionalHotel = hotelRepository.findById(Objects.requireNonNull(hotelId));

        if (optionalHotel.isEmpty()) {
            return ResponseEntity.status(404).body("Hotel not found");
        }

        Hotel hotel = optionalHotel.get();
        hotel.setName(updatedHotel.getName());
        hotel.setAddress(updatedHotel.getAddress());
        hotel.setCity(updatedHotel.getCity());
        hotel.setStarRating(normalizeStarRating(updatedHotel.getStarRating()));
        hotel.setAmenities(normalizeAmenities(updatedHotel.getAmenities()));
        hotel.setFreeCancellationBeforeDays(Math.max(updatedHotel.getFreeCancellationBeforeDays(), 0));
        hotel.setLateCancellationRefundRate(clampPercent(updatedHotel.getLateCancellationRefundRate()));
        applyImagePayload(hotel, updatedHotel);
        hotel.setApprovalStatus(updatedHotel.getApprovalStatus() == null
                ? hotel.getApprovalStatus()
                : updatedHotel.getApprovalStatus());
        hotel.setApprovalNote(updatedHotel.getApprovalNote());
        if (updatedHotel.getApprovalStatus() == HotelApprovalStatus.APPROVED) {
            hotel.setApprovedAt(hotel.getApprovedAt() == null ? LocalDateTime.now() : hotel.getApprovedAt());
        }

        return ResponseEntity.ok(hotelRepository.save(hotel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHotel(@PathVariable String id) {
        String hotelId = requireNonBlank(id, "Hotel id is required");

        if (!hotelRepository.existsById(Objects.requireNonNull(hotelId))) {
            return ResponseEntity.status(404).body("Hotel not found");
        }

        hotelRepository.deleteById(Objects.requireNonNull(hotelId));
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchHotel(
            @RequestParam String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        String cityKeyword = requireNonBlank(city, "City is required");
        List<Hotel> matchedHotels = hotelRepository.findAll()
                .stream()
                .filter(this::isPublicHotel)
                .filter((hotel) -> {
                    String hotelCity = hotel.getCity() == null ? "" : hotel.getCity().toLowerCase();
                    return hotelCity.contains(cityKeyword.toLowerCase());
                })
                .sorted(Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int start = Math.min(safePage * safeSize, matchedHotels.size());
        int end = Math.min(start + safeSize, matchedHotels.size());
        List<Hotel> content = matchedHotels.subList(start, end);
        int totalPages = matchedHotels.isEmpty() ? 0 : (int) Math.ceil((double) matchedHotels.size() / safeSize);

        return ResponseEntity.ok(Map.of(
                "content", content,
                "totalPages", totalPages
        ));
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<?> getRecommendations(
            @PathVariable String id,
            @RequestParam(defaultValue = "4") int limit) {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel currentHotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        List<Hotel> recommendations = hotelRepository.findAll()
                .stream()
                .filter(this::isPublicHotel)
                .filter((hotel) -> !Objects.equals(hotel.getId(), currentHotel.getId()))
                .sorted((left, right) -> {
                    int sameCityLeft = sameCityScore(left, currentHotel);
                    int sameCityRight = sameCityScore(right, currentHotel);
                    if (sameCityLeft != sameCityRight) {
                        return Integer.compare(sameCityRight, sameCityLeft);
                    }

                    int ratingCompare = Double.compare(right.getAverageRating(), left.getAverageRating());
                    if (ratingCompare != 0) {
                        return ratingCompare;
                    }

                    int starCompare = Integer.compare(right.getStarRating(), left.getStarRating());
                    if (starCompare != 0) {
                        return starCompare;
                    }

                    return Long.compare(right.getReviewCount(), left.getReviewCount());
                })
                .limit(Math.max(limit, 1))
                .toList();

        return ResponseEntity.ok(recommendations);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) throws IOException {

        String hotelId = requireNonBlank(id, "Hotel id is required");

        if (!hotelRepository.existsById(Objects.requireNonNull(hotelId))) {
            return ResponseEntity.status(404).body("Hotel not found");
        }

        Hotel hotel = hotelRepository.findById(Objects.requireNonNull(hotelId))
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
        String uploadedUrl = uploadStorageService.storeImage(file);
        List<String> mergedImages = new ArrayList<>();
        mergedImages.add(uploadedUrl);
        mergedImages.addAll(hotel.getImageUrls());
        hotel.setImageUrls(mergedImages);
        hotel.setImageUrl(uploadedUrl);

        return ResponseEntity.ok(hotelRepository.save(hotel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files) throws IOException {

        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel hotel = hotelRepository.findById(Objects.requireNonNull(hotelId))
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(hotel.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        hotel.setImageUrls(mergedImages);

        return ResponseEntity.ok(hotelRepository.save(hotel));
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

    private void applyImagePayload(Hotel targetHotel, Hotel payloadHotel) {
        if (targetHotel == null || payloadHotel == null || !hasImagePayload(payloadHotel)) {
            return;
        }

        targetHotel.setImageUrls(payloadHotel.getImageUrls());
        if (hasText(payloadHotel.getImageUrl())) {
            targetHotel.setImageUrl(payloadHotel.getImageUrl());
        }
    }

    private boolean isPublicHotel(Hotel hotel) {
        return hotel != null && hotel.getApprovalStatus() == HotelApprovalStatus.APPROVED;
    }

    private int sameCityScore(Hotel hotel, Hotel currentHotel) {
        String leftCity = hotel == null || hotel.getCity() == null ? "" : hotel.getCity().trim().toLowerCase();
        String rightCity = currentHotel == null || currentHotel.getCity() == null
                ? ""
                : currentHotel.getCity().trim().toLowerCase();

        return leftCity.isEmpty() || rightCity.isEmpty() || !leftCity.equals(rightCity) ? 0 : 1;
    }

    private boolean hasImagePayload(Hotel hotel) {
        return hotel != null
                && (hasText(hotel.getImageUrl())
                || hotel.getImageUrls().stream().anyMatch(this::hasText));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

