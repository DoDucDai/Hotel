package com.example.hotelbooking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.Review;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByHotelIdOrderByCreatedAtDesc(String hotelId);

    boolean existsByBookingId(String bookingId);

    Optional<Review> findByBookingId(String bookingId);

    List<Review> findByUserId(String userId);
}
