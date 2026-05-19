package com.example.hotelbooking.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

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
import com.example.hotelbooking.service.HotelCatalogService;

@RestController
@RequestMapping("/hotels")
public class HotelController {

    private final HotelCatalogService hotelCatalogService;

    public HotelController(HotelCatalogService hotelCatalogService) {
        this.hotelCatalogService = hotelCatalogService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHotels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minStars,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String amenity,
            @RequestParam(required = false) Boolean freeCancellation,
            @RequestParam(required = false, defaultValue = "name_asc") String sortBy) {

        return ResponseEntity.ok(hotelCatalogService.getPublicHotels(
                page,
                size,
                destination,
                city,
                minPrice,
                maxPrice,
                minStars,
                minRating,
                amenity,
                freeCancellation,
                sortBy));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHotelById(@PathVariable String id) {
        return ResponseEntity.ok(hotelCatalogService.getPublicHotelById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createHotel(@RequestBody Hotel hotel) {
        return ResponseEntity.ok(hotelCatalogService.createHotel(hotel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateHotel(
            @PathVariable String id,
            @RequestBody Hotel updatedHotel) {
        return ResponseEntity.ok(hotelCatalogService.updateHotel(id, updatedHotel));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHotel(@PathVariable String id) {
        return ResponseEntity.ok(hotelCatalogService.deleteHotel(id));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchHotel(
            @RequestParam String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(hotelCatalogService.searchHotel(city, page, size));
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<List<Hotel>> getRecommendations(
            @PathVariable String id,
            @RequestParam(defaultValue = "4") int limit) {

        return ResponseEntity.ok(hotelCatalogService.getRecommendations(id, limit));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadImage(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(hotelCatalogService.uploadImage(id, file));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/images")
    public ResponseEntity<?> uploadImages(
            @PathVariable String id,
            @RequestParam("files") MultipartFile[] files) throws IOException {
        return ResponseEntity.ok(hotelCatalogService.uploadImages(id, files));
    }
}
