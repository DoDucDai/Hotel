package com.example.hotelbooking.service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.UpdateProfileRequest;
import com.example.hotelbooking.dto.UserAccountResponse;
import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthTokenService authTokenService;
    private final AuthEmailService authEmailService;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       AuthTokenService authTokenService,
                       AuthEmailService authEmailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authTokenService = authTokenService;
        this.authEmailService = authEmailService;
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }

    // GET ALL
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // GET BY ID
    public User getUserById(String id) {
        String userId = requireNonBlank(id, "User id is required");
        return userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    // CREATE USER
    public User createUser(User user) {
        User userToCreate = Objects.requireNonNull(user, "User is required");
        String normalizedEmail = normalizeEmail(userToCreate.getEmail());
        if (normalizedEmail == null) {
            throw new BadRequestException("Email is required");
        }

        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        String rawPassword = requireNonBlank(userToCreate.getPassword(), "Password is required");

        userToCreate.setEmail(normalizedEmail);
        userToCreate.setPassword(passwordEncoder.encode(rawPassword));

        return userRepository.save(userToCreate);
    }

    // UPDATE USER (ADMIN)
    public User updateUser(String id, User updatedUser) {
        String userId = requireNonBlank(id, "User id is required");
        User payload = Objects.requireNonNull(updatedUser, "User payload is required");
        User user = getUserById(userId);

        String newEmail = normalizeEmail(payload.getEmail());
        if (newEmail != null && !user.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                throw new BadRequestException("Email already exists");
            }

            user.setEmail(newEmail);
        }

        if (payload.getName() != null) {
            user.setName(payload.getName().trim());
        }

        if (payload.getPassword() != null && !payload.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(payload.getPassword()));
        }

        if (payload.getRole() != null) {
            user.setRole(payload.getRole());
        }

        user.setGender(payload.getGender());
        user.setDateOfBirth(payload.getDateOfBirth());
        user.setCitizenId(payload.getCitizenId());
        user.setBankProvider(payload.getBankProvider());
        user.setBankAccountName(payload.getBankAccountName());
        user.setBankAccountNumber(payload.getBankAccountNumber());

        return userRepository.save(user);
    }

    // DELETE
    public void deleteUser(String id) {
        String userId = requireNonBlank(id, "User id is required");
        userRepository.deleteById(Objects.requireNonNull(userId));
    }

    // GET CURRENT USER
    public User getCurrentUser(String email) {
        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new UnauthorizedException("Email is required");
        }

        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    public UserAccountResponse getCurrentUserAccount(String email) {
        User user = getCurrentUser(email);
        return UserAccountResponse.fromUser(user);
    }

    public UserAccountResponse updateCurrentUserProfile(
            String email, UpdateProfileRequest request) {

        User user = getCurrentUser(email);
        UpdateProfileRequest safeRequest = Objects.requireNonNull(request, "Profile request is required");

        if (safeRequest.getName() != null) {
            user.setName(safeRequest.getName().trim());
        }

        if (safeRequest.getGender() != null) {
            user.setGender(safeRequest.getGender().trim());
        }

        if (safeRequest.getDateOfBirth() != null) {
            user.setDateOfBirth(safeRequest.getDateOfBirth().trim());
        }

        if (safeRequest.getCitizenId() != null) {
            user.setCitizenId(safeRequest.getCitizenId().trim());
        }

        if (safeRequest.getBankProvider() != null) {
            user.setBankProvider(safeRequest.getBankProvider().trim());
        }

        if (safeRequest.getBankAccountName() != null) {
            user.setBankAccountName(safeRequest.getBankAccountName().trim());
        }

        if (safeRequest.getBankAccountNumber() != null) {
            user.setBankAccountNumber(safeRequest.getBankAccountNumber().trim());
        }

        User savedUser = userRepository.save(Objects.requireNonNull(user));
        return UserAccountResponse.fromUser(savedUser);
    }

    public User updateCurrentUserEmail(String currentEmail, String newEmailRaw) {
        User user = getCurrentUser(currentEmail);

        String newEmail = normalizeEmail(newEmailRaw);
        if (newEmail == null) {
            throw new BadRequestException("Email is required");
        }

        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            return user;
        }

        if (userRepository.findByEmail(newEmail).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        user.setEmail(newEmail);
        return userRepository.save(user);
    }

    public Map<String, Object> requestCurrentUserEmailChangeOtp(String currentEmail, String newEmailRaw) {
        User user = getCurrentUser(currentEmail);
        String newEmail = normalizeEmail(newEmailRaw);

        if (newEmail == null) {
            throw new BadRequestException("Email is required");
        }

        if (newEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BadRequestException("Email moi trung voi email hien tai");
        }

        if (userRepository.findByEmail(newEmail).isPresent()) {
            throw new BadRequestException("Email already exists");
        }

        AuthActionToken token = authTokenService.createToken(
                user,
                AuthActionType.EMAIL_CHANGE,
                Duration.ofMinutes(15),
                newEmail);
        authEmailService.sendEmailChangeOtp(user, newEmail, token.getToken());

        return Map.of(
                "message", "Da gui ma OTP xac nhan doi email. Vui long kiem tra hop thu cua ban",
                "expiresAt", token.getExpiresAt() == null ? "" : token.getExpiresAt().toString());
    }

    public User confirmCurrentUserEmailChangeOtp(String currentEmail, String newEmailRaw, String otpRaw) {
        User user = getCurrentUser(currentEmail);
        String newEmail = normalizeEmail(newEmailRaw);
        if (newEmail == null) {
            throw new BadRequestException("Email is required");
        }

        String otp = requireNonBlank(otpRaw, "OTP is required").trim();
        AuthActionToken token = authTokenService.requireValidToken(otp, AuthActionType.EMAIL_CHANGE);

        if (!Objects.equals(token.getUserId(), user.getId())) {
            throw new UnauthorizedException("OTP khong thuoc tai khoan hien tai");
        }

        String tokenEmail = normalizeEmail(token.getEmail());
        if (tokenEmail == null || !tokenEmail.equalsIgnoreCase(newEmail)) {
            throw new BadRequestException("OTP khong khop voi email can doi");
        }

        userRepository.findByEmail(newEmail).ifPresent(existingUser -> {
            if (!Objects.equals(existingUser.getId(), user.getId())) {
                throw new BadRequestException("Email already exists");
            }
        });

        user.setEmail(newEmail);
        user.setEmailVerified(Boolean.TRUE);
        user.setEmailVerifiedAt(Instant.now().toString());

        User savedUser = userRepository.save(user);
        authTokenService.clearUserTokens(user.getId(), AuthActionType.EMAIL_CHANGE);
        return savedUser;
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return null;
        }

        return normalized;
    }
}

