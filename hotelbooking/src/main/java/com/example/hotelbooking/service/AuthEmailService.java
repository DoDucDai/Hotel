package com.example.hotelbooking.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.model.User;

@Service
public class AuthEmailService {

    private static final Logger log = LoggerFactory.getLogger(AuthEmailService.class);

    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String mailFrom;

    public AuthEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
            @Value("${app.mail.from:no-reply@hotelbooking.local}") String mailFrom) {

        this.mailSender = mailSenderProvider.getIfAvailable();
        this.frontendUrl = frontendUrl == null || frontendUrl.isBlank()
                ? "http://localhost:5173"
                : frontendUrl.trim();
        this.mailFrom = mailFrom == null || mailFrom.isBlank()
                ? "no-reply@hotelbooking.local"
                : mailFrom.trim();
    }

    public void sendEmailVerification(User user, String token) {
        String actionUrl = buildActionUrl("/verify-email", token);
        String message = """
                Xin chao,

                Cam on ban da dang ky tai khoan Hotel Booking.
                Vui long bam vao link ben duoi de xac nhan dia chi email cua ban:
                %s

                Link xac nhan co hieu luc trong 24 gio.
                Neu ban khong tao tai khoan nay, ban co the bo qua email.
                """.formatted(actionUrl);

        sendMessage(user.getEmail(), "Xac nhan email - Hotel Booking", message, "email verification", actionUrl);
    }

    public void sendPasswordReset(User user, String token) {
        String actionUrl = buildActionUrl("/reset-password", token);
        String message = """
                Xin chao,

                Chung toi da nhan duoc yeu cau dat lai mat khau cho tai khoan Hotel Booking cua ban.
                Bam vao link ben duoi de tao mat khau moi:
                %s

                Link dat lai mat khau co hieu luc trong 30 phut.
                Neu ban khong thuc hien yeu cau nay, hay bo qua email.
                """.formatted(actionUrl);

        sendMessage(user.getEmail(), "Dat lai mat khau - Hotel Booking", message, "password reset", actionUrl);
    }

    private String buildActionUrl(String path, String token) {
        String baseUrl = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;

        return baseUrl + path + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private void sendMessage(
            String to,
            String subject,
            String body,
            String actionName,
            String fallbackUrl) {

        if (mailSender == null) {
            log.warn("JavaMailSender chua duoc cau hinh. {} link for {}: {}", actionName, to, fallbackUrl);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        if (!mailFrom.isBlank()) {
            message.setFrom(mailFrom);
        }

        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.warn("Khong gui duoc {} toi {}. Fallback link: {}", actionName, to, fallbackUrl, ex);
        }
    }
}
