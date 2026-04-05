package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.model.AuthActionToken;
import com.example.hotelbooking.model.AuthActionType;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private AuthTokenService authTokenService;

    @Mock
    private AuthEmailService authEmailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                refreshTokenService,
                authTokenService,
                authEmailService);
    }

    @Test
    void createAdminNormalizesEmailAndMarksAsVerified() {
        User payload = new User();
        payload.setName("New Admin");
        payload.setEmail("  Admin@Example.com  ");
        payload.setPassword("secret123");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded-secret");
        when(userRepository.save(any(User.class))).thenAnswer((invocation) -> invocation.getArgument(0));

        Map<String, Object> response = authService.createAdmin(payload);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertEquals("admin@example.com", saved.getEmail());
        assertEquals(Role.ADMIN, saved.getRole());
        assertEquals(Boolean.TRUE, saved.getEmailVerified());
        assertEquals("encoded-secret", saved.getPassword());
        assertTrue(saved.getEmailVerifiedAt() != null && !saved.getEmailVerifiedAt().isBlank());
        assertEquals("Admin created successfully", response.get("message"));
    }

    @Test
    void createAdminRejectsDuplicateEmail() {
        User existing = new User();
        existing.setEmail("admin@example.com");

        User payload = new User();
        payload.setEmail("admin@example.com");
        payload.setPassword("secret123");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(existing));

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> authService.createAdmin(payload));

        assertEquals("Email da ton tai", ex.getMessage());
    }

    @Test
    void registerCreatesUserAndSendsVerificationEmail() {
        User payload = new User();
        payload.setName("User A");
        payload.setEmail(" UserA@Example.com ");
        payload.setPassword("secret123");

        User savedUser = new User();
        savedUser.setId("user-1");
        savedUser.setEmail("usera@example.com");

        AuthActionToken token = new AuthActionToken();
        token.setToken("verify-token");
        token.setType(AuthActionType.EMAIL_VERIFICATION);
        token.setExpiresAt(Instant.now().plusSeconds(3600));

        when(userRepository.findByEmail("usera@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("secret123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(authTokenService.createToken(any(User.class), any(AuthActionType.class), any()))
                .thenReturn(token);

        Map<String, Object> response = authService.register(payload);

        verify(authEmailService).sendEmailVerification(savedUser, "verify-token");
        assertEquals("usera@example.com", response.get("email"));
        assertEquals(Boolean.FALSE, response.get("emailVerified"));
    }
}
