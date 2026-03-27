package com.example.hotelbooking.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.Wishlist;

public interface WishlistRepository extends MongoRepository<Wishlist, String> {

    List<Wishlist> findByUserIdOrderByCreatedAtDesc(String userId);

    boolean existsByUserIdAndHotelId(String userId, String hotelId);

    Optional<Wishlist> findByUserIdAndHotelId(String userId, String hotelId);

    void deleteByUserIdAndHotelId(String userId, String hotelId);
}
