package com.example.hotelbooking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.Dispute;

public interface DisputeRepository extends MongoRepository<Dispute, String> {

    boolean existsByBookingIdAndUserId(String bookingId, String userId);

    List<Dispute> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Dispute> findAllByOrderByCreatedAtDesc();
}
