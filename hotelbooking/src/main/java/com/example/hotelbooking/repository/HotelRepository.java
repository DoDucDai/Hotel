package com.example.hotelbooking.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;

import com.example.hotelbooking.model.Hotel;

public interface HotelRepository extends MongoRepository<Hotel, String> {

    List<Hotel> findByNameContainingIgnoreCase(String name);
    List<Hotel> findByOwnerId(String ownerId);

      Page<Hotel> findByCityContainingIgnoreCase(String city, Pageable pageable);


}
