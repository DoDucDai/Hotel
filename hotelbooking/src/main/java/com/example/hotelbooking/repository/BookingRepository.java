package com.example.hotelbooking.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.Booking;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByRoomId(String roomId);

    List<Booking> findByCheckInDateLessThanEqualAndCheckOutDateGreaterThanEqual(
            LocalDate checkOut,
            LocalDate checkIn
    );
    List<Booking> findByUserId(String userId);
}