package com.example.hotelbooking.controller;

import java.io.File;
import java.io.IOException;
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
import com.example.hotelbooking.repository.HotelRepository;

@RestController
@RequestMapping("/hotels")
public class HotelController {

    private final HotelRepository hotelRepository;

    public HotelController(HotelRepository hotelRepository) {
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public ResponseEntity<?> getHotels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Hotel> hotelPage = hotelRepository.findAll(pageable);

        return ResponseEntity.ok(Map.of(
                "content", hotelPage.getContent(),
                "totalPages", hotelPage.getTotalPages(),
                "totalElements", hotelPage.getTotalElements(),
                "currentPage", page
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHotelById(@PathVariable String id) {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        Optional<Hotel> optionalHotel = hotelRepository.findById(Objects.requireNonNull(hotelId));

        if (optionalHotel.isPresent()) {
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
        hotel.setImageUrl(updatedHotel.getImageUrl());
        hotel.setStarRating(normalizeStarRating(updatedHotel.getStarRating()));
        hotel.setAmenities(normalizeAmenities(updatedHotel.getAmenities()));

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
        Pageable pageable = PageRequest.of(page, size);

        Page<Hotel> hotelPage
                = hotelRepository.findByCityContainingIgnoreCase(cityKeyword, pageable);

        return ResponseEntity.ok(Map.of(
                "content", hotelPage.getContent(),
                "totalPages", hotelPage.getTotalPages()
        ));
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

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Only image allowed");
        }

        // Save uploads to project root `uploads/` so WebConfig can serve them
        String uploadDir = System.getProperty("user.dir") + "/uploads";
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        File dest = new File(folder, fileName);
        file.transferTo(dest);

        Hotel hotel = hotelRepository.findById(Objects.requireNonNull(hotelId))
                .orElseThrow(() -> new RuntimeException("Hotel not found"));
        hotel.setImageUrl("/uploads/" + fileName);

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
}

