package com.example.hotelbooking.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.EmailRequest;
import com.example.hotelbooking.dto.LoginRequest;
import com.example.hotelbooking.dto.ResetPasswordRequest;
import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;
import com.example.hotelbooking.model.RefreshToken;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.security.JwtUtil;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final AuthTokenService authTokenService;
    private final AuthEmailService authEmailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService,
            AuthTokenService authTokenService,
            AuthEmailService authEmailService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
        this.authTokenService = authTokenService;
        this.authEmailService = authEmailService;
    }

    public Map<String, Object> register(User payload) {
        User request = Objects.requireNonNull(payload, "User payload is required");

        String name = requireNonBlank(request.getName(), "Name is required").trim();
        String email = normalizeEmail(request.getEmail());
        String rawPassword = requirePassword(request.getPassword());

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email da ton tai");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(Role.USER);
        user.setEmailVerified(Boolean.FALSE);
        user.setEmailVerifiedAt(null);

        User savedUser = userRepository.save(user);
        AuthActionToken verificationToken = authTokenService.createToken(
                savedUser,
                AuthActionType.EMAIL_VERIFICATION,
                Duration.ofHours(24));
        authEmailService.sendEmailVerification(savedUser, verificationToken.getToken());

        return Map.of(
                "message", "Dang ky thanh cong. Vui long kiem tra email de xac nhan tai khoan.",
                "email", savedUser.getEmail(),
                "emailVerified", Boolean.FALSE
        );
    }

    public Map<String, Object> login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        String password = requireNonBlank(request.getPassword(), "Password is required");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        String accessToken = JwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken.getToken(),
                "role", user.getRole().name(),
                "emailVerified", Boolean.TRUE.equals(user.getEmailVerified())
        );
    }

    public Map<String, String> refreshToken(String refreshTokenValue) {
        String tokenValue = requireNonBlank(refreshTokenValue, "Refresh token is required");
        RefreshToken token = refreshTokenService.verify(tokenValue);
        String userId = requireNonBlank(token.getUserId(), "Token does not contain user id");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String accessToken = JwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        return Map.of("accessToken", accessToken);
    }

    public Map<String, Object> createAdmin(User payload) {
        User request = Objects.requireNonNull(payload, "User payload is required");
        String email = normalizeEmail(request.getEmail());
        String rawPassword = requirePassword(request.getPassword());

        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email da ton tai");
        }

        request.setEmail(email);
        request.setPassword(passwordEncoder.encode(rawPassword));
        request.setRole(Role.ADMIN);
        request.setEmailVerified(Boolean.TRUE);
        request.setEmailVerifiedAt(Instant.now().toString());

        User savedAdmin = userRepository.save(request);

        return Map.of(
                "message", "Admin created successfully",
                "email", savedAdmin.getEmail()
        );
    }

    public Map<String, String> resendVerificationEmail(EmailRequest request) {
        EmailRequest safeRequest = Objects.requireNonNull(request, "Email request is required");
        String email = normalizeEmail(safeRequest.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Khong tim thay tai khoan voi email nay"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return Map.of("message", "Email nay da duoc xac nhan truoc do");
        }

        AuthActionToken verificationToken = authTokenService.createToken(
                user,
                AuthActionType.EMAIL_VERIFICATION,
                Duration.ofHours(24));
        authEmailService.sendEmailVerification(user, verificationToken.getToken());

        return Map.of("message", "Da gui lai email xac nhan. Vui long kiem tra hop thu cua ban");
    }

    public Map<String, Object> verifyEmail(String token) {
        AuthActionToken authToken = authTokenService.requireValidToken(token, AuthActionType.EMAIL_VERIFICATION);
        User user = userRepository.findById(authToken.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setEmailVerified(Boolean.TRUE);
        user.setEmailVerifiedAt(Instant.now().toString());
        userRepository.save(user);
        authTokenService.clearUserTokens(user.getId(), AuthActionType.EMAIL_VERIFICATION);

        return Map.of(
                "message", "Email da duoc xac nhan thanh cong",
                "email", user.getEmail(),
                "emailVerified", Boolean.TRUE
        );
    }

    public Map<String, String> forgotPassword(EmailRequest request) {
        EmailRequest safeRequest = Objects.requireNonNull(request, "Email request is required");
        String email = normalizeEmail(safeRequest.getEmail());

        userRepository.findByEmail(email).ifPresent((user) -> {
            AuthActionToken resetToken = authTokenService.createToken(
                    user,
                    AuthActionType.PASSWORD_RESET,
                    Duration.ofMinutes(30));
            authEmailService.sendPasswordReset(user, resetToken.getToken());
        });

        return Map.of(
                "message",
                "Neu email ton tai trong he thong, chung toi da gui huong dan dat lai mat khau"
        );
    }

    public Map<String, Object> validateResetPasswordToken(String token) {
        AuthActionToken authToken = authTokenService.requireValidToken(token, AuthActionType.PASSWORD_RESET);
        return Map.of(
                "message", "Token hop le",
                "email", authToken.getEmail(),
                "expiresAt", authToken.getExpiresAt().toString()
        );
    }

    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        ResetPasswordRequest safeRequest = Objects.requireNonNull(request, "Reset password request is required");
        AuthActionToken authToken = authTokenService.requireValidToken(
                safeRequest.getToken(),
                AuthActionType.PASSWORD_RESET);
        String newPassword = requirePassword(safeRequest.getPassword());

        User user = userRepository.findById(authToken.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        authTokenService.clearUserTokens(user.getId(), AuthActionType.PASSWORD_RESET);

        return Map.of("message", "Dat lai mat khau thanh cong. Ban co the dang nhap lai");
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(message);
        }

        return value;
    }

    private String requirePassword(String password) {
        String normalizedPassword = requireNonBlank(password, "Password is required").trim();
        if (normalizedPassword.length() < 6) {
            throw new RuntimeException("Mat khau phai co it nhat 6 ky tu");
        }

        return normalizedPassword;
    }

    private String normalizeEmail(String email) {
        String normalizedEmail = requireNonBlank(email, "Email is required").trim().toLowerCase();
        if (normalizedEmail.isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        return normalizedEmail;
    }
}
