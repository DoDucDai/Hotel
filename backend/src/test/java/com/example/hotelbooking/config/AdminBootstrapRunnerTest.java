package com.example.hotelbooking.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AdminBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void shouldSkipWhenAdminAlreadyExists() throws Exception {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(true);

        AdminBootstrapRunner runner = new AdminBootstrapRunner(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(runner, "bootstrapEmail", "admin@hotelbooking.local");
        ReflectionTestUtils.setField(runner, "bootstrapPassword", "ChangeMe123!");

        runner.run(new DefaultApplicationArguments(new String[0]));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void shouldCreateBootstrapAdminWhenConfigIsValidAndNoAdminExists() throws Exception {
        when(userRepository.existsByRole(Role.ADMIN)).thenReturn(false);
        when(userRepository.findByEmail("admin@hotelbooking.local")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ChangeMe123!")).thenReturn("encoded-password");

        AdminBootstrapRunner runner = new AdminBootstrapRunner(userRepository, passwordEncoder);
        ReflectionTestUtils.setField(runner, "bootstrapName", "Bootstrap Admin");
        ReflectionTestUtils.setField(runner, "bootstrapEmail", "admin@hotelbooking.local");
        ReflectionTestUtils.setField(runner, "bootstrapPassword", "ChangeMe123!");

        runner.run(new DefaultApplicationArguments(new String[0]));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals("Bootstrap Admin", savedUser.getName());
        assertEquals("admin@hotelbooking.local", savedUser.getEmail());
        assertEquals("encoded-password", savedUser.getPassword());
        assertEquals(Role.ADMIN, savedUser.getRole());
    }
}
