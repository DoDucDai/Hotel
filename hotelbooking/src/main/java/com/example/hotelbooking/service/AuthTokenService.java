package com.example.hotelbooking.service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.AuthActionTokenRepository;

@Service
public class AuthTokenService {

    private final AuthActionTokenRepository authActionTokenRepository;

    public AuthTokenService(AuthActionTokenRepository authActionTokenRepository) {
        this.authActionTokenRepository = authActionTokenRepository;
    }

    public AuthActionToken createToken(User user, AuthActionType type, Duration ttl) {
        authActionTokenRepository.deleteByUserIdAndType(user.getId(), type);

        AuthActionToken token = new AuthActionToken();
        token.setUserId(user.getId());
        token.setEmail(user.getEmail());
        token.setType(type);
        token.setToken(UUID.randomUUID().toString());
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(ttl));

        return authActionTokenRepository.save(token);
    }

    public AuthActionToken requireValidToken(String rawToken, AuthActionType expectedType) {
        String tokenValue = requireNonBlank(rawToken, "Token is required");

        AuthActionToken token = authActionTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new RuntimeException("Token khong hop le hoac da het han"));

        if (token.getType() != expectedType) {
            throw new RuntimeException("Token khong dung muc dich xac thuc");
        }

        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(Instant.now())) {
            authActionTokenRepository.deleteById(token.getId());
            throw new RuntimeException("Token da het han. Vui long tao yeu cau moi");
        }

        return token;
    }

    public void clearUserTokens(String userId, AuthActionType type) {
        if (userId == null || userId.isBlank()) {
            return;
        }

        authActionTokenRepository.deleteByUserIdAndType(userId, type);
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }
}
