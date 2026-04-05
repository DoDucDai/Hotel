package com.example.hotelbooking.security;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

public class JwtUtil {

    private static final String JWT_SECRET_ENV = "JWT_SECRET";
    private static final int MIN_SECRET_BYTES = 48; // HS384 requires at least 384 bits

    private static final String SECRET = resolveSecret();
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    private static final long EXPIRATION = 86400000;

    public static String generateToken(String username, String role) {

        return Jwts.builder()
                .setSubject(username)
                .claim("role", role)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION))
                .signWith(KEY, SignatureAlgorithm.HS384)
                .compact();
    }

    public static String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    public static String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    private static Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public static boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (Exception e) {
            System.out.println("JWT VALIDATE ERROR: " + e.getMessage());
            return false;
        }
    }

    private static String resolveSecret() {
        String secret = System.getenv(JWT_SECRET_ENV);

        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "Missing JWT secret. Set environment variable JWT_SECRET and rotate it regularly.");
        }

        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET is too short for HS384. It must be at least 48 bytes.");
        }

        return secret;
    }
}
