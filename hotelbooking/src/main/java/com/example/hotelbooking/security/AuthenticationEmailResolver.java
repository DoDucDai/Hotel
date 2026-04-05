package com.example.hotelbooking.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.example.hotelbooking.exception.UnauthorizedException;

@Component
public class AuthenticationEmailResolver {

    public String requireEmail(Authentication authentication) {
        if (authentication == null) {
            throw new UnauthorizedException("Unauthorized");
        }

        String email = authentication.getName();
        if (email == null || email.isBlank()) {
            throw new UnauthorizedException("Unauthorized");
        }

        return email.trim();
    }
}
