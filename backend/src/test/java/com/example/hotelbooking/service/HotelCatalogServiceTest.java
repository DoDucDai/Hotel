package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;

import com.example.hotelbooking.dto.HotelCatalogItemDTO;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class HotelCatalogServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private UploadStorageService uploadStorageService;

    @Mock
    private MongoTemplate mongoTemplate;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RoomInventoryService roomInventoryService;

    private HotelCatalogService hotelCatalogService;

    @BeforeEach
    void setUp() {
        hotelCatalogService = new HotelCatalogService(
                hotelRepository,
                uploadStorageService,
                mongoTemplate,
                roomRepository,
                bookingRepository,
                roomInventoryService);
    }

    @Test
    void getPublicHotelsMapsCatalogItemsFromAggregationResult() {
        Document hotelDoc = new Document("_id", "h2")
                .append("name", "Luxury Stay")
                .append("city", "Ha Noi")
                .append("starRating", 5)
                .append("averageRating", 4.8)
                .append("reviewCount", 120L)
                .append("amenities", List.of("Wifi", "Pool"))
                .append("minRoomPrice", 1_500_000d)
                .append("roomCount", 4)
                .append("freeCancellationBeforeDays", 3)
                .append("lateCancellationRefundRate", 50);

        Document aggregationPayload = new Document("content", List.of(hotelDoc))
                .append("metadata", List.of(new Document("totalElements", 1L)));

        AggregationResults<Document> mockedResult = new AggregationResults<>(
                List.of(aggregationPayload),
                new Document("ok", 1));

        when(mongoTemplate.aggregate(any(Aggregation.class), eq("hotels"), eq(Document.class)))
                .thenReturn(mockedResult);

        Map<String, Object> response = hotelCatalogService.getPublicHotels(
                0,
                10,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "rating_desc");

        @SuppressWarnings("unchecked")
        List<HotelCatalogItemDTO> content = (List<HotelCatalogItemDTO>) response.get("content");

        assertFalse(content.isEmpty());
        assertEquals("h2", content.get(0).getId());
        assertEquals(4, content.get(0).getRoomCount());
        assertEquals(1_500_000d, content.get(0).getMinRoomPrice());
        assertEquals(1L, response.get("totalElements"));
        assertEquals(1, response.get("totalPages"));
        assertEquals(0, response.get("currentPage"));
    }

    @Test
    void getPublicHotelsCalculatesTotalPagesFromTotalElementsAndSize() {
        Document hotelOne = new Document("_id", "h1").append("name", "A");
        Document hotelTwo = new Document("_id", "h2").append("name", "B");

        Document aggregationPayload = new Document("content", List.of(hotelOne, hotelTwo))
                .append("metadata", List.of(new Document("totalElements", 5L)));

        AggregationResults<Document> mockedResult = new AggregationResults<>(
                List.of(aggregationPayload),
                new Document("ok", 1));

        when(mongoTemplate.aggregate(any(Aggregation.class), eq("hotels"), eq(Document.class)))
                .thenReturn(mockedResult);

        Map<String, Object> response = hotelCatalogService.getPublicHotels(
                1,
                2,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "unknown");

        @SuppressWarnings("unchecked")
        List<HotelCatalogItemDTO> content = (List<HotelCatalogItemDTO>) response.get("content");

        assertEquals(2, content.size());
        assertEquals(3, response.get("totalPages"));
        assertEquals(1, response.get("currentPage"));
    }
}

