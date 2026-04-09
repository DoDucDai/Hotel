package com.example.hotelbooking.service;

import java.time.Duration;
import java.time.Instant;
import java.security.SecureRandom;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.InternalServerException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.AuthActionTokenRepository;

@Service
public class AuthTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int OTP_DIGITS = 6;
    private static final int OTP_MAX_VALUE = 1_000_000;
    private static final int OTP_RETRY_LIMIT = 12;

    private final AuthActionTokenRepository authActionTokenRepository;

    public AuthTokenService(AuthActionTokenRepository authActionTokenRepository) {
        this.authActionTokenRepository = authActionTokenRepository;
    }

    public AuthActionToken createToken(User user, AuthActionType type, Duration ttl) {
        return createToken(user, type, ttl, null);
    }

    public AuthActionToken createToken(User user, AuthActionType type, Duration ttl, String tokenEmail) {
        authActionTokenRepository.deleteByUserIdAndType(user.getId(), type);

        AuthActionToken token = new AuthActionToken();
        token.setUserId(user.getId());
        token.setEmail(resolveTokenEmail(user, tokenEmail));
        token.setType(type);
        token.setToken(type == AuthActionType.PASSWORD_RESET || type == AuthActionType.EMAIL_CHANGE
                ? generateSixDigitOtp()
                : UUID.randomUUID().toString());
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(ttl));

        return authActionTokenRepository.save(token);
    }

    public AuthActionToken requireValidToken(String rawToken, AuthActionType expectedType) {
        String tokenValue = requireNonBlank(rawToken, "Token is required");

        AuthActionToken token = authActionTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new UnauthorizedException("Token khong hop le hoac da het han"));

        if (token.getType() != expectedType) {
            throw new UnauthorizedException("Token khong dung muc dich xac thuc");
        }

        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(Instant.now())) {
            authActionTokenRepository.deleteById(token.getId());
            throw new UnauthorizedException("Token da het han. Vui long tao yeu cau moi");
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
            throw new BadRequestException(message);
        }

        return value.trim();
    }

    private String resolveTokenEmail(User user, String tokenEmail) {
        if (tokenEmail != null && !tokenEmail.isBlank()) {
            return tokenEmail.trim().toLowerCase();
        }

        return user.getEmail();
    }

    private String generateSixDigitOtp() {
        for (int attempt = 0; attempt < OTP_RETRY_LIMIT; attempt += 1) {
            String code = String.format("%0" + OTP_DIGITS + "d", SECURE_RANDOM.nextInt(OTP_MAX_VALUE));
            if (authActionTokenRepository.findByToken(code).isEmpty()) {
                return code;
            }
        }

        throw new InternalServerException("Khong the tao ma OTP reset password. Vui long thu lai");
    }
}
