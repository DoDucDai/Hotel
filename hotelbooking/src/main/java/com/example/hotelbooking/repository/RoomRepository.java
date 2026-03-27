package com.example.hotelbooking.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.Room;


public interface RoomRepository extends MongoRepository<Room, String> {
    List<Room> findByCapacityGreaterThanEqual(int capacity);
    List<Room> findByHotelId(String hotelId);
    List<Room> findByOwnerId(String ownerId);

    Page<Room> findByCapacityGreaterThanEqual(int capacity, Pageable pageable);

}

