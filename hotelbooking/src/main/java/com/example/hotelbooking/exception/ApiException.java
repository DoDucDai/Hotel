package com.example.hotelbooking.exception;

import java.util.Objects;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;

public abstract class ApiException extends RuntimeException {

    private final @NonNull HttpStatus status;

    protected ApiException(@NonNull HttpStatus status, String message) {
        super(message);
        this.status = Objects.requireNonNull(status, "HttpStatus is required");
    }

    public @NonNull HttpStatus getStatus() {
        return status;
    }
}
