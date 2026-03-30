package com.example.hotelbooking.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.hotelbooking.model.AuditLog;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {

    List<AuditLog> findTop200ByOrderByCreatedAtDesc();
}
