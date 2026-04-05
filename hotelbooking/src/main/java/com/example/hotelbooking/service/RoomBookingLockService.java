package com.example.hotelbooking.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.function.Supplier;

import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.InternalServerException;
import com.example.hotelbooking.model.RoomBookingLock;

@Service
public class RoomBookingLockService {

    private static final Duration LOCK_TTL = Duration.ofSeconds(12);
    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(4);
    private static final Duration RETRY_DELAY = Duration.ofMillis(80);

    private final MongoTemplate mongoTemplate;

    public RoomBookingLockService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public <T> T executeWithLock(String roomId, Supplier<T> task) {
        String normalizedRoomId = requireNonBlank(roomId, "Room id is required");
        Supplier<T> safeTask = requireTask(task);

        String token = acquireLock(normalizedRoomId);
        try {
            return safeTask.get();
        } finally {
            releaseLock(normalizedRoomId, token);
        }
    }

    public void executeWithLock(String roomId, Runnable task) {
        executeWithLock(roomId, () -> {
            task.run();
            return null;
        });
    }

    private String acquireLock(String roomId) {
        Instant deadline = Instant.now().plus(WAIT_TIMEOUT);
        String token = UUID.randomUUID().toString();

        while (Instant.now().isBefore(deadline)) {
            if (tryAcquire(roomId, token)) {
                return token;
            }

            sleepRetry();
        }

        throw new InternalServerException("He thong dang ban, vui long thu dat phong lai.");
    }

    private boolean tryAcquire(String roomId, String token) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(LOCK_TTL);

        Query query = new Query(
                new Criteria().andOperator(
                        Criteria.where("_id").is(roomId),
                        new Criteria().orOperator(
                                Criteria.where("ownerToken").is(null),
                                Criteria.where("expiresAt").lte(now))));

        Update update = new Update()
                .set("ownerToken", token)
                .set("acquiredAt", now)
                .set("expiresAt", expiresAt);

        FindAndModifyOptions options = FindAndModifyOptions.options()
                .upsert(true)
                .returnNew(true);

        RoomBookingLock lock = mongoTemplate.findAndModify(query, update, options, RoomBookingLock.class);
        return lock != null && token.equals(lock.getOwnerToken());
    }

    private void releaseLock(String roomId, String token) {
        Query releaseQuery = new Query(
                new Criteria().andOperator(
                        Criteria.where("_id").is(roomId),
                        Criteria.where("ownerToken").is(token)));

        Update releaseUpdate = new Update()
                .set("ownerToken", null)
                .set("acquiredAt", null)
                .set("expiresAt", Instant.EPOCH);

        mongoTemplate.updateFirst(releaseQuery, releaseUpdate, RoomBookingLock.class);
    }

    private void sleepRetry() {
        try {
            Thread.sleep(RETRY_DELAY.toMillis());
        } catch (InterruptedException interruptedException) {
            Thread.currentThread().interrupt();
            throw new InternalServerException("Khong the dat phong luc nay. Vui long thu lai.");
        }
    }

    private <T> Supplier<T> requireTask(Supplier<T> task) {
        if (task == null) {
            throw new BadRequestException("Booking task is required");
        }
        return task;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }
}
