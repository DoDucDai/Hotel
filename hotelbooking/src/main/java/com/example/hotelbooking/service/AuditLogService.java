package com.example.hotelbooking.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.model.AuditLog;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.AuditLogRepository;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(String action, String entityType, String entityId, User actor, String message) {
        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setMessage(message);
        log.setCreatedAt(LocalDateTime.now());

        if (actor != null) {
            log.setActorUserId(actor.getId());
            log.setActorEmail(actor.getEmail());
            log.setActorRole(actor.getRole() == null ? null : actor.getRole().name());
        }

        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop200ByOrderByCreatedAtDesc();
    }
}
