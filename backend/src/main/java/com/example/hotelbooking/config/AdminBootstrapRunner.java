package com.example.hotelbooking.config;

import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.UserRepository;

@Component
@ConditionalOnProperty(prefix = "app.bootstrap-admin", name = "enabled", havingValue = "true")
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap-admin.name:}")
    private String bootstrapName;

    @Value("${app.bootstrap-admin.email:}")
    private String bootstrapEmail;

    @Value("${app.bootstrap-admin.password:}")
    private String bootstrapPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByRole(Role.ADMIN)) {
            LOGGER.info("Skip admin bootstrap: at least one ADMIN account already exists.");
            return;
        }

        String normalizedEmail = normalizeEmail(bootstrapEmail);
        String normalizedPassword = bootstrapPassword == null ? "" : bootstrapPassword.trim();
        String normalizedName = bootstrapName == null ? "" : bootstrapName.trim();

        if (normalizedEmail == null || normalizedPassword.isBlank()) {
            LOGGER.warn(
                    "Skip admin bootstrap: APP_BOOTSTRAP_ADMIN_EMAIL or APP_BOOTSTRAP_ADMIN_PASSWORD is missing.");
            return;
        }

        Optional<User> existing = userRepository.findByEmail(normalizedEmail);
        if (existing.isPresent()) {
            LOGGER.warn("Skip admin bootstrap: user email {} already exists.", normalizedEmail);
            return;
        }

        User admin = new User();
        admin.setName(normalizedName.isBlank() ? "System Admin" : normalizedName);
        admin.setEmail(normalizedEmail);
        admin.setPassword(passwordEncoder.encode(normalizedPassword));
        admin.setRole(Role.ADMIN);
        admin.setEmailVerified(Boolean.TRUE);
        admin.setEmailVerifiedAt(Instant.now().toString());

        userRepository.save(admin);
        LOGGER.info("Bootstrap admin has been created with email {}.", normalizedEmail);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }

        String normalized = email.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }
}
