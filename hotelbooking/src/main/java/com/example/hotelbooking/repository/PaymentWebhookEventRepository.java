package com.example.hotelbooking.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.PaymentWebhookEvent;

public interface PaymentWebhookEventRepository extends MongoRepository<PaymentWebhookEvent, String> {

    Optional<PaymentWebhookEvent> findByEventKey(String eventKey);
}
