package com.example.hotelbooking.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@Service
public class HotelCatalogService {

    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final UploadStorageService uploadStorageService;

    public HotelCatalogService(
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            UploadStorageService uploadStorageService) {
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.uploadStorageService = uploadStorageService;
    }

    public Map<String, Object> getPublicHotels(
            int page,
            int size,
            String destination,
            String city,
            Double minPrice,
            Double maxPrice,
            Integer minStars,
            Double minRating,
            String amenity,
            Boolean freeCancellation,
            String sortBy) {

        List<Hotel> allPublicHotels = hotelRepository.findAll()
                .stream()
                .filter(this::isPublicHotel)
                .toList();

        Map<String, Double> minRoomPriceByHotel = buildMinRoomPriceByHotel();

        List<Hotel> filtered = allPublicHotels.stream()
                .filter((hotel) -> matchesDestination(hotel, destination))
                .filter((hotel) -> matchesCity(hotel, city))
                .filter((hotel) -> matchesPriceRange(hotel, minPriceByHotelValue(minRoomPriceByHotel, hotel), minPrice, maxPrice))
                .filter((hotel) -> hotel.getStarRating() >= normalizeMinStars(minStars))
                .filter((hotel) -> hotel.getAverageRating() >= normalizeMinRating(minRating))
                .filter((hotel) -> matchesAmenity(hotel, amenity))
                .filter((hotel) -> !Boolean.TRUE.equals(freeCancellation)
                        || Math.max(hotel.getFreeCancellationBeforeDays(), 0) > 0)
                .sorted(buildSortComparator(sortBy, minRoomPriceByHotel))
                .toList();

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        int start = Math.min(safePage * safeSize, filtered.size());
        int end = Math.min(start + safeSize, filtered.size());
        List<Hotel> content = filtered.subList(start, end);
        int totalPages = filtered.isEmpty() ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);

        return Map.of(
                "content", content,
                "totalPages", totalPages,
                "totalElements", filtered.size(),
                "currentPage", safePage);
    }

    public Hotel getPublicHotelById(String id) {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        return hotelRepository.findById(hotelId)
                .filter(this::isPublicHotel)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Hotel createHotel(Hotel hotel) {
        if (hotel == null) {
            throw new BadRequestException("Hotel payload is required");
        }

        Hotel payload = hotel;
        if (payload.getName() == null || payload.getName().isBlank()) {
            throw new BadRequestException("Hotel name is required");
        }

        payload.setStarRating(normalizeStarRating(payload.getStarRating()));
        payload.setAmenities(normalizeAmenities(payload.getAmenities()));
        payload.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        payload.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyImagePayload(payload, payload);

        return hotelRepository.save(payload);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Hotel updateHotel(String id, Hotel updatedHotel) {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        if (updatedHotel == null) {
            throw new BadRequestException("Hotel payload is required");
        }

        Hotel payload = updatedHotel;

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        hotel.setName(payload.getName());
        hotel.setAddress(payload.getAddress());
        hotel.setCity(payload.getCity());
        hotel.setStarRating(normalizeStarRating(payload.getStarRating()));
        hotel.setAmenities(normalizeAmenities(payload.getAmenities()));
        hotel.setFreeCancellationBeforeDays(Math.max(payload.getFreeCancellationBeforeDays(), 0));
        hotel.setLateCancellationRefundRate(clampPercent(payload.getLateCancellationRefundRate()));
        applyImagePayload(hotel, payload);
        hotel.setApprovalStatus(payload.getApprovalStatus() == null
                ? hotel.getApprovalStatus()
                : payload.getApprovalStatus());
        hotel.setApprovalNote(payload.getApprovalNote());
        if (payload.getApprovalStatus() == HotelApprovalStatus.APPROVED) {
            hotel.setApprovedAt(hotel.getApprovedAt() == null ? LocalDateTime.now() : hotel.getApprovedAt());
        }

        return hotelRepository.save(hotel);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deleteHotel(String id) {
        String hotelId = requireNonBlank(id, "Hotel id is required");

        if (!hotelRepository.existsById(hotelId)) {
            throw new NotFoundException("Hotel not found");
        }

        hotelRepository.deleteById(hotelId);
        return Map.of("message", "Deleted successfully");
    }

    public Map<String, Object> searchHotel(String city, int page, int size) {
        String cityKeyword = requireNonBlank(city, "City is required");
        return getPublicHotels(page, size, null, cityKeyword, null, null, null, null, null, null, "name_asc");
    }

    public List<Hotel> getRecommendations(String id, int limit) {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel currentHotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        return hotelRepository.findAll()
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
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Hotel uploadImage(String id, MultipartFile file) throws IOException {
        String hotelId = requireNonBlank(id, "Hotel id is required");

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        String uploadedUrl = uploadStorageService.storeImage(file);
        List<String> mergedImages = new ArrayList<>();
        mergedImages.add(uploadedUrl);
        mergedImages.addAll(hotel.getImageUrls());
        hotel.setImageUrls(mergedImages);
        hotel.setImageUrl(uploadedUrl);

        return hotelRepository.save(hotel);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Hotel uploadImages(String id, MultipartFile[] files) throws IOException {
        String hotelId = requireNonBlank(id, "Hotel id is required");
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NotFoundException("Hotel not found"));

        List<String> uploadedUrls = uploadStorageService.storeImages(files);
        List<String> mergedImages = new ArrayList<>(hotel.getImageUrls());
        mergedImages.addAll(uploadedUrls);
        hotel.setImageUrls(mergedImages);

        return hotelRepository.save(hotel);
    }

    private Map<String, Double> buildMinRoomPriceByHotel() {
        Map<String, Double> minByHotel = new HashMap<>();
        for (Room room : roomRepository.findAll()) {
            if (room == null || room.getHotelId() == null || room.getHotelId().isBlank()) {
                continue;
            }

            double price = Math.max(room.getPrice(), 0);
            String hotelId = room.getHotelId();
            Double currentMin = minByHotel.get(hotelId);
            if (currentMin == null || price < currentMin) {
                minByHotel.put(hotelId, price);
            }
        }
        return minByHotel;
    }

    private double minPriceByHotelValue(Map<String, Double> minByHotel, Hotel hotel) {
        if (hotel == null || hotel.getId() == null) {
            return Double.POSITIVE_INFINITY;
        }

        return minByHotel.getOrDefault(hotel.getId(), Double.POSITIVE_INFINITY);
    }

    private Comparator<Hotel> buildSortComparator(String sortBy, Map<String, Double> minRoomPriceByHotel) {
        String normalizedSort = sortBy == null ? "name_asc" : sortBy.trim().toLowerCase();

        if ("price_desc".equals(normalizedSort)) {
            return Comparator
                    .comparingDouble((Hotel hotel) -> minPriceByHotelValue(minRoomPriceByHotel, hotel))
                    .reversed()
                    .thenComparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        }

        if ("price_asc".equals(normalizedSort)) {
            return Comparator
                    .comparingDouble((Hotel hotel) -> minPriceByHotelValue(minRoomPriceByHotel, hotel))
                    .thenComparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        }

        if ("rating_desc".equals(normalizedSort)) {
            return Comparator
                    .comparingDouble(Hotel::getAverageRating)
                    .reversed()
                    .thenComparing(Comparator.comparingLong(Hotel::getReviewCount).reversed())
                    .thenComparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase));
        }

        if ("name_desc".equals(normalizedSort)) {
            return Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase)).reversed();
        }

        return Comparator.comparing(Hotel::getName, Comparator.nullsLast(String::compareToIgnoreCase));
    }

    private boolean matchesDestination(Hotel hotel, String destination) {
        String keyword = trimToNull(destination);
        if (keyword == null) {
            return true;
        }

        String normalized = keyword.toLowerCase();

        return containsIgnoreCase(hotel.getName(), normalized)
                || containsIgnoreCase(hotel.getCity(), normalized)
                || containsIgnoreCase(hotel.getAddress(), normalized);
    }

    private boolean matchesCity(Hotel hotel, String city) {
        String keyword = trimToNull(city);
        if (keyword == null) {
            return true;
        }

        return containsIgnoreCase(hotel.getCity(), keyword.toLowerCase());
    }

    private boolean matchesPriceRange(Hotel hotel, double minHotelPrice, Double minPrice, Double maxPrice) {
        if (hotel == null) {
            return false;
        }

        if (minPrice == null && maxPrice == null) {
            return true;
        }

        if (!Double.isFinite(minHotelPrice)) {
            return false;
        }

        if (minPrice != null && minHotelPrice < Math.max(minPrice, 0)) {
            return false;
        }

        return maxPrice == null || minHotelPrice <= Math.max(maxPrice, 0);
    }

    private boolean matchesAmenity(Hotel hotel, String amenity) {
        String amenityKeyword = trimToNull(amenity);
        if (amenityKeyword == null || "all".equalsIgnoreCase(amenityKeyword)) {
            return true;
        }

        String normalized = amenityKeyword.toLowerCase();
        return hotel.getAmenities().stream()
                .filter(Objects::nonNull)
                .map(value -> value.trim().toLowerCase())
                .anyMatch(value -> value.equals(normalized));
    }

    private int normalizeMinStars(Integer minStars) {
        if (minStars == null) {
            return 0;
        }

        return Math.min(Math.max(minStars, 0), 5);
    }

    private double normalizeMinRating(Double minRating) {
        if (minRating == null || !Double.isFinite(minRating)) {
            return 0;
        }

        return Math.min(Math.max(minRating, 0), 5);
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
        if (hotel == null) {
            return false;
        }

        List<String> imageUrls = hotel.getImageUrls() == null ? List.of() : hotel.getImageUrls();
        return hotel != null
                && (hasText(hotel.getImageUrl())
                || imageUrls.stream().anyMatch(this::hasText));
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }

    private boolean containsIgnoreCase(String value, String keywordLowerCase) {
        if (value == null || keywordLowerCase == null) {
            return false;
        }

        return value.toLowerCase().contains(keywordLowerCase);
    }
}
