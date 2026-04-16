package com.example.hotelbooking.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationOperation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.hotelbooking.dto.HotelCatalogItemDTO;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.repository.HotelRepository;

@Service
public class HotelCatalogService {

    private static final String DEFAULT_SORT_BY = "name_asc";
    private static final double PRICE_SORT_ASC_SENTINEL = 9_999_999_999_999d;

    private final HotelRepository hotelRepository;
    private final UploadStorageService uploadStorageService;
    private final MongoTemplate mongoTemplate;

    public HotelCatalogService(
            HotelRepository hotelRepository,
            UploadStorageService uploadStorageService,
            MongoTemplate mongoTemplate) {
        this.hotelRepository = hotelRepository;
        this.uploadStorageService = uploadStorageService;
        this.mongoTemplate = mongoTemplate;
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

        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        String normalizedSort = normalizeSortBy(sortBy);

        List<AggregationOperation> operations = new ArrayList<>();
        operations.add((context) -> new Document("$match", buildPublicHotelMatch(
                destination,
                city,
                minStars,
                minRating,
                amenity,
                freeCancellation)));

        operations.add((context) -> new Document("$lookup", new Document("from", "rooms")
                .append("localField", "_id")
                .append("foreignField", "hotelId")
                .append("as", "rooms")));

        operations.add((context) -> new Document("$addFields", new Document("roomCount",
                new Document("$size", new Document("$ifNull", List.of("$rooms", List.of()))))
                .append("minRoomPrice", new Document("$min", "$rooms.price"))));

        Document priceRangeMatch = buildPriceRangeMatch(minPrice, maxPrice);
        if (!priceRangeMatch.isEmpty()) {
            operations.add((context) -> new Document("$match", priceRangeMatch));
        }

        Document effectivePriceField = buildEffectivePriceField(normalizedSort);
        if (!effectivePriceField.isEmpty()) {
            operations.add((context) -> new Document("$addFields", effectivePriceField));
        }

        long skip = (long) safePage * safeSize;
        Document sortDocument = buildSortDocument(normalizedSort);
        Document projection = buildCatalogProjection();

        operations.add((context) -> new Document("$facet", new Document("content", List.of(
                new Document("$sort", sortDocument),
                new Document("$skip", skip),
                new Document("$limit", safeSize),
                new Document("$project", projection)))
                .append("metadata", List.of(new Document("$count", "totalElements")))));

        Aggregation aggregation = Aggregation.newAggregation(operations);
        AggregationResults<Document> aggregationResults = mongoTemplate.aggregate(
                aggregation,
                "hotels",
                Document.class);

        Document resultDocument = aggregationResults.getUniqueMappedResult();
        List<Document> rawContent = resultDocument == null
                ? List.of()
                : resultDocument.getList("content", Document.class, List.of());

        List<Document> metadata = resultDocument == null
                ? List.of()
                : resultDocument.getList("metadata", Document.class, List.of());

        long totalElements = metadata.isEmpty() ? 0L : toLong(metadata.get(0).get("totalElements"));
        int totalPages = totalElements == 0L ? 0 : (int) Math.ceil((double) totalElements / safeSize);

        List<HotelCatalogItemDTO> content = rawContent.stream()
                .map(this::toCatalogItem)
                .toList();

        return Map.of(
                "content", content,
                "totalPages", totalPages,
                "totalElements", totalElements,
                "currentPage", safePage,
                "pageSize", safeSize);
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

    private Document buildPublicHotelMatch(
            String destination,
            String city,
            Integer minStars,
            Double minRating,
            String amenity,
            Boolean freeCancellation) {
        List<Document> filters = new ArrayList<>();
        // Backward-compatible public visibility:
        // old documents may not have approvalStatus persisted, but are treated as APPROVED by model defaults.
        filters.add(new Document("$or", List.of(
                new Document("approvalStatus", HotelApprovalStatus.APPROVED.name()),
                new Document("approvalStatus", null),
                new Document("approvalStatus", new Document("$exists", false)))));

        String destinationKeyword = trimToNull(destination);
        if (destinationKeyword != null) {
            Pattern pattern = containsPattern(destinationKeyword);
            filters.add(new Document("$or", List.of(
                    new Document("name", new Document("$regex", pattern)),
                    new Document("city", new Document("$regex", pattern)),
                    new Document("address", new Document("$regex", pattern)))));
        }

        String cityKeyword = trimToNull(city);
        if (cityKeyword != null) {
            filters.add(new Document("city", new Document("$regex", containsPattern(cityKeyword))));
        }

        int normalizedMinStars = normalizeMinStars(minStars);
        if (normalizedMinStars > 0) {
            filters.add(new Document("starRating", new Document("$gte", normalizedMinStars)));
        }

        double normalizedMinRating = normalizeMinRating(minRating);
        if (normalizedMinRating > 0) {
            filters.add(new Document("averageRating", new Document("$gte", normalizedMinRating)));
        }

        String amenityKeyword = trimToNull(amenity);
        if (amenityKeyword != null && !"all".equalsIgnoreCase(amenityKeyword)) {
            String exactAmenity = "^" + Pattern.quote(amenityKeyword) + "$";
            filters.add(new Document("amenities", new Document("$regex", Pattern.compile(exactAmenity, Pattern.CASE_INSENSITIVE))));
        }

        if (Boolean.TRUE.equals(freeCancellation)) {
            filters.add(new Document("freeCancellationBeforeDays", new Document("$gt", 0)));
        }

        if (filters.size() == 1) {
            return filters.get(0);
        }

        return new Document("$and", filters);
    }

    private Pattern containsPattern(String keyword) {
        return Pattern.compile(Pattern.quote(keyword), Pattern.CASE_INSENSITIVE);
    }

    private Document buildPriceRangeMatch(Double minPrice, Double maxPrice) {
        Double normalizedMinPrice = normalizePrice(minPrice);
        Double normalizedMaxPrice = normalizePrice(maxPrice);

        if (normalizedMinPrice == null && normalizedMaxPrice == null) {
            return new Document();
        }

        Document conditions = new Document("$ne", null);
        if (normalizedMinPrice != null) {
            conditions.append("$gte", normalizedMinPrice);
        }
        if (normalizedMaxPrice != null) {
            conditions.append("$lte", normalizedMaxPrice);
        }

        return new Document("minRoomPrice", conditions);
    }

    private Document buildEffectivePriceField(String normalizedSortBy) {
        if ("price_asc".equals(normalizedSortBy)) {
            return new Document("effectiveMinRoomPrice", new Document("$ifNull", List.of("$minRoomPrice", PRICE_SORT_ASC_SENTINEL)));
        }

        if ("price_desc".equals(normalizedSortBy)) {
            return new Document("effectiveMinRoomPrice", new Document("$ifNull", List.of("$minRoomPrice", -1)));
        }

        return new Document();
    }

    private Document buildSortDocument(String normalizedSortBy) {
        if ("price_desc".equals(normalizedSortBy)) {
            return new Document("effectiveMinRoomPrice", -1).append("name", 1);
        }

        if ("price_asc".equals(normalizedSortBy)) {
            return new Document("effectiveMinRoomPrice", 1).append("name", 1);
        }

        if ("rating_desc".equals(normalizedSortBy)) {
            return new Document("averageRating", -1)
                    .append("reviewCount", -1)
                    .append("name", 1);
        }

        if ("city_desc".equals(normalizedSortBy)) {
            return new Document("city", -1).append("name", 1);
        }

        if ("city_asc".equals(normalizedSortBy)) {
            return new Document("city", 1).append("name", 1);
        }

        if ("name_desc".equals(normalizedSortBy)) {
            return new Document("name", -1);
        }

        return new Document("name", 1);
    }

    private Document buildCatalogProjection() {
        return new Document("_id", 1)
                .append("ownerId", 1)
                .append("name", 1)
                .append("address", 1)
                .append("city", 1)
                .append("imageUrl", 1)
                .append("imageUrls", 1)
                .append("starRating", 1)
                .append("amenities", 1)
                .append("averageRating", 1)
                .append("reviewCount", 1)
                .append("freeCancellationBeforeDays", 1)
                .append("lateCancellationRefundRate", 1)
                .append("minRoomPrice", 1)
                .append("roomCount", 1);
    }

    private HotelCatalogItemDTO toCatalogItem(Document source) {
        HotelCatalogItemDTO item = new HotelCatalogItemDTO();

        item.setId(readString(source.get("_id")));
        item.setOwnerId(readString(source.get("ownerId")));
        item.setName(readString(source.get("name")));
        item.setAddress(readString(source.get("address")));
        item.setCity(readString(source.get("city")));
        item.setImageUrl(readString(source.get("imageUrl")));
        item.setImageUrls(readStringList(source.get("imageUrls")));
        item.setStarRating(toInt(source.get("starRating")));
        item.setAmenities(readStringList(source.get("amenities")));
        item.setAverageRating(toDouble(source.get("averageRating")));
        item.setReviewCount(toLong(source.get("reviewCount")));
        item.setFreeCancellationBeforeDays(toInt(source.get("freeCancellationBeforeDays")));
        item.setLateCancellationRefundRate(toInt(source.get("lateCancellationRefundRate")));
        item.setMinRoomPrice(toDouble(source.get("minRoomPrice")));
        item.setRoomCount(toInt(source.get("roomCount")));

        return item;
    }

    private String normalizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return DEFAULT_SORT_BY;
        }

        String normalized = sortBy.trim().toLowerCase().replace('-', '_');
        if ("name_desc".equals(normalized)
                || "city_asc".equals(normalized)
                || "city_desc".equals(normalized)
                || "price_asc".equals(normalized)
                || "price_desc".equals(normalized)
                || "rating_desc".equals(normalized)) {
            return normalized;
        }

        return DEFAULT_SORT_BY;
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

    private Double normalizePrice(Double value) {
        if (value == null || !Double.isFinite(value)) {
            return null;
        }

        return Math.max(value, 0);
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

    private String readString(Object value) {
        if (value == null) {
            return null;
        }

        String normalized = value.toString().trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private List<String> readStringList(Object value) {
        if (!(value instanceof List<?> sourceValues)) {
            return List.of();
        }

        return sourceValues.stream()
                .filter(Objects::nonNull)
                .map(Object::toString)
                .map(String::trim)
                .filter((text) -> !text.isEmpty())
                .toList();
    }

    private double toDouble(Object value) {
        if (value instanceof Number numberValue) {
            return numberValue.doubleValue();
        }

        if (value == null) {
            return 0;
        }

        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private long toLong(Object value) {
        if (value instanceof Number numberValue) {
            return numberValue.longValue();
        }

        if (value == null) {
            return 0;
        }

        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private int toInt(Object value) {
        if (value instanceof Number numberValue) {
            return numberValue.intValue();
        }

        if (value == null) {
            return 0;
        }

        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }
}

