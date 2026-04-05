package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.HotelApprovalStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;

@ExtendWith(MockitoExtension.class)
class HotelCatalogServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UploadStorageService uploadStorageService;

    private HotelCatalogService hotelCatalogService;

    @BeforeEach
    void setUp() {
        hotelCatalogService = new HotelCatalogService(hotelRepository, roomRepository, uploadStorageService);
    }

    @Test
    void getPublicHotelsAppliesPriceAndStarFilters() {
        Hotel lowStarHotel = new Hotel();
        lowStarHotel.setId("h1");
        lowStarHotel.setName("Budget Inn");
        lowStarHotel.setCity("Ha Noi");
        lowStarHotel.setStarRating(2);
        lowStarHotel.setApprovalStatus(HotelApprovalStatus.APPROVED);

        Hotel luxuryHotel = new Hotel();
        luxuryHotel.setId("h2");
        luxuryHotel.setName("Luxury Stay");
        luxuryHotel.setCity("Ha Noi");
        luxuryHotel.setStarRating(5);
        luxuryHotel.setAverageRating(4.8);
        luxuryHotel.setApprovalStatus(HotelApprovalStatus.APPROVED);

        Room cheapRoom = new Room();
        cheapRoom.setHotelId("h1");
        cheapRoom.setPrice(400_000);

        Room expensiveRoom = new Room();
        expensiveRoom.setHotelId("h2");
        expensiveRoom.setPrice(1_500_000);

        when(hotelRepository.findAll()).thenReturn(List.of(lowStarHotel, luxuryHotel));
        when(roomRepository.findAll()).thenReturn(List.of(cheapRoom, expensiveRoom));

        Map<String, Object> response = hotelCatalogService.getPublicHotels(
                0,
                10,
                null,
                null,
                1_000_000.0,
                null,
                4,
                4.0,
                null,
                null,
                "rating_desc");

        @SuppressWarnings("unchecked")
        List<Hotel> content = (List<Hotel>) response.get("content");

        assertEquals(1, content.size());
        assertEquals("h2", content.get(0).getId());
        assertEquals(1, response.get("totalElements"));
    }

    @Test
    void getPublicHotelsSortsByRatingDescThenReviewCountDesc() {
        Hotel highReview = new Hotel();
        highReview.setId("h1");
        highReview.setName("High Review");
        highReview.setApprovalStatus(HotelApprovalStatus.APPROVED);
        highReview.setAverageRating(4.8);
        highReview.setReviewCount(120);

        Hotel lowReview = new Hotel();
        lowReview.setId("h2");
        lowReview.setName("Low Review");
        lowReview.setApprovalStatus(HotelApprovalStatus.APPROVED);
        lowReview.setAverageRating(4.8);
        lowReview.setReviewCount(30);

        Hotel lowerRating = new Hotel();
        lowerRating.setId("h3");
        lowerRating.setName("Lower Rating");
        lowerRating.setApprovalStatus(HotelApprovalStatus.APPROVED);
        lowerRating.setAverageRating(4.2);
        lowerRating.setReviewCount(500);

        Room room1 = new Room();
        room1.setHotelId("h1");
        room1.setPrice(900_000);

        Room room2 = new Room();
        room2.setHotelId("h2");
        room2.setPrice(850_000);

        Room room3 = new Room();
        room3.setHotelId("h3");
        room3.setPrice(700_000);

        when(hotelRepository.findAll()).thenReturn(List.of(lowReview, lowerRating, highReview));
        when(roomRepository.findAll()).thenReturn(List.of(room1, room2, room3));

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
        List<Hotel> content = (List<Hotel>) response.get("content");

        assertEquals(3, content.size());
        assertEquals("h1", content.get(0).getId());
        assertEquals("h2", content.get(1).getId());
        assertEquals("h3", content.get(2).getId());
    }
}
