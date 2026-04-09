package com.example.hotelbooking.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.NotificationDTO;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.Notification;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.NotificationRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class NotificationService {

    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@hotelbooking.local}")
    private String mailFrom;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository,
            JavaMailSender mailSender) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public Notification createForUser(
            String userId,
            String type,
            String title,
            String message,
            String entityType,
            String entityId,
            boolean sendEmail) {

        String normalizedUserId = requireNonBlank(userId, "User id is required");

        Notification notification = new Notification();
        notification.setUserId(normalizedUserId);
        notification.setType(trimToNull(type) == null ? "SYSTEM" : type.trim().toUpperCase());
        notification.setTitle(requireNonBlank(title, "Notification title is required"));
        notification.setMessage(requireNonBlank(message, "Notification message is required"));
        notification.setEntityType(trimToNull(entityType));
        notification.setEntityId(trimToNull(entityId));
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        if (sendEmail) {
            sendNotificationEmail(normalizedUserId, saved);
        }

        return saved;
    }

    public void createForUsers(
            Collection<String> userIds,
            String type,
            String title,
            String message,
            String entityType,
            String entityId,
            boolean sendEmail) {

        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        userIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .forEach((userId) -> createForUser(userId, type, title, message, entityType, entityId, sendEmail));
    }

    public void createForAllAdmins(
            String type,
            String title,
            String message,
            String entityType,
            String entityId,
            boolean sendEmail) {

        List<String> adminIds = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.ADMIN)
                .map(User::getId)
                .filter(Objects::nonNull)
                .toList();

        createForUsers(adminIds, type, title, message, entityType, entityId, sendEmail);
    }

    public List<NotificationDTO> getMyNotifications(String email) {
        User user = getCurrentUser(email);
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Map<String, Long> getUnreadCount(String email) {
        User user = getCurrentUser(email);
        long unreadCount = notificationRepository.countByUserIdAndReadFalse(user.getId());
        return Map.of("unread", unreadCount);
    }

    public NotificationDTO markAsRead(String notificationId, String email) {
        User user = getCurrentUser(email);
        Notification notification = notificationRepository.findById(requireNonBlank(notificationId, "Notification id is required"))
                .orElseThrow(() -> new NotFoundException("Notification not found"));

        if (!Objects.equals(notification.getUserId(), user.getId()) && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Ban khong co quyen cap nhat thong bao nay");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return toDTO(notification);
    }

    public Map<String, Integer> markAllAsRead(String email) {
        User user = getCurrentUser(email);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        int updatedCount = 0;
        List<Notification> toSave = new ArrayList<>();

        for (Notification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
                toSave.add(notification);
                updatedCount += 1;
            }
        }

        if (!toSave.isEmpty()) {
            notificationRepository.saveAll(toSave);
        }

        return Map.of("updated", updatedCount);
    }

    private NotificationDTO toDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setEntityType(notification.getEntityType());
        dto.setEntityId(notification.getEntityId());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setReadAt(notification.getReadAt());
        return dto;
    }

    private void sendNotificationEmail(@NonNull String userId, Notification notification) {
        try {
            User targetUser = userRepository.findById(userId).orElse(null);
            if (targetUser == null || targetUser.getEmail() == null || targetUser.getEmail().isBlank()) {
                return;
            }

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(mailFrom);
            mail.setTo(targetUser.getEmail());
            mail.setSubject("[HotelBooking] " + notification.getTitle());

            StringBuilder content = new StringBuilder();
            content.append(notification.getMessage()).append("\n\n");
            content.append("Xem them trong trung tam thong bao: ").append(frontendUrl).append("/account");

            if (notification.getEntityType() != null && notification.getEntityId() != null) {
                content.append("\nTham chieu: ")
                        .append(notification.getEntityType())
                        .append(" #")
                        .append(notification.getEntityId());
            }

            mail.setText(content.toString());
            mailSender.send(mail);
        } catch (Exception ex) {
            LOGGER.warn("Cannot send notification email: {}", ex.getMessage());
        }
    }

    private User getCurrentUser(String email) {
        String normalizedEmail = requireNonBlank(email, "Unauthorized").trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            if ("Unauthorized".equalsIgnoreCase(message)) {
                throw new UnauthorizedException(message);
            }

            throw new BadRequestException(message);
        }

        return value;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
