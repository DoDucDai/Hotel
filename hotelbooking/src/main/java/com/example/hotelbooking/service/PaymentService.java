package com.example.hotelbooking.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.PaymentCheckoutResponse;
import com.example.hotelbooking.dto.SandboxPaymentWebhookRequest;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.PaymentWebhookEvent;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.PaymentWebhookEventRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class PaymentService {

    private static final String SANDBOX_PROVIDER = "SANDBOX";
    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_FAILED = "FAILED";

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8080}")
    private String backendUrl;

    @Value("${payment.sandbox.secret:replace-me-sandbox-payment-secret}")
    private String sandboxSecret;

    public PaymentService(
            BookingRepository bookingRepository,
            UserRepository userRepository,
            PaymentWebhookEventRepository paymentWebhookEventRepository,
            AuditLogService auditLogService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.paymentWebhookEventRepository = paymentWebhookEventRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    public PaymentCheckoutResponse createSandboxCheckout(String bookingId, String email) {
        String normalizedBookingId = requireNonBlank(bookingId, "Booking id is required");
        User user = getCurrentUser(email);
        Booking booking = getBookingById(normalizedBookingId);
        assertBookingVisible(user, booking);

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking da huy, khong the tao phien thanh toan");
        }

        if (booking.getPaymentStatus() == PaymentStatus.PAID) {
            throw new BadRequestException("Booking nay da thanh toan");
        }

        if (booking.getPaymentMethod() == null || booking.getPaymentMethod().name().equals("PAY_AT_HOTEL")) {
            throw new BadRequestException("Booking thanh toan tai khach san khong can checkout online");
        }

        double amount = resolveFinalPrice(booking);
        String transactionRef = UUID.randomUUID().toString().replace("-", "");
        String checkoutSignature = buildSandboxCheckoutSignature(normalizedBookingId, transactionRef, amount);
        String checkoutUrl = buildSandboxCheckoutUrl(normalizedBookingId, transactionRef, amount, checkoutSignature);

        PaymentCheckoutResponse response = new PaymentCheckoutResponse();
        response.setBookingId(normalizedBookingId);
        response.setProvider(SANDBOX_PROVIDER);
        response.setTransactionRef(transactionRef);
        response.setCheckoutUrl(checkoutUrl);
        response.setAmount(amount);
        response.setCurrency("VND");

        return response;
    }

    public Map<String, Object> processSandboxWebhook(SandboxPaymentWebhookRequest request) {
        SandboxPaymentWebhookRequest safeRequest =
                Objects.requireNonNull(request, "Webhook payload is required");

        String bookingId = requireNonBlank(safeRequest.getBookingId(), "bookingId is required");
        String transactionRef = requireNonBlank(safeRequest.getTransactionRef(), "transactionRef is required");
        String normalizedStatus = normalizeWebhookStatus(safeRequest.getStatus());
        double amount = Math.max(safeRequest.getAmount(), 0);
        String signature = requireNonBlank(safeRequest.getSignature(), "signature is required");

        if (!isValidSandboxWebhookSignature(bookingId, transactionRef, amount, normalizedStatus, signature)) {
            throw new BadRequestException("Webhook signature khong hop le");
        }

        String eventKey = buildWebhookEventKey(transactionRef);
        if (paymentWebhookEventRepository.findByEventKey(eventKey).isPresent()) {
            return Map.of(
                    "message", "Webhook da duoc xu ly truoc do",
                    "duplicate", Boolean.TRUE,
                    "applied", Boolean.FALSE);
        }

        PaymentWebhookEvent event = new PaymentWebhookEvent();
        event.setEventKey(eventKey);
        event.setProvider(SANDBOX_PROVIDER);
        event.setProviderTransactionId(transactionRef);
        event.setBookingId(bookingId);
        event.setPaymentStatus(normalizedStatus);
        event.setAmount(amount);
        event.setReceivedAt(LocalDateTime.now());

        try {
            paymentWebhookEventRepository.save(event);
        } catch (DuplicateKeyException duplicateKeyException) {
            return Map.of(
                    "message", "Webhook trung lap",
                    "duplicate", Boolean.TRUE,
                    "applied", Boolean.FALSE);
        }

        Booking booking = getBookingById(bookingId);
        PaymentStatus nextStatus = STATUS_SUCCESS.equals(normalizedStatus) ? PaymentStatus.PAID : PaymentStatus.FAILED;
        boolean applied = applyPaymentStatusTransition(booking, nextStatus, amount);

        event.setProcessedAt(LocalDateTime.now());
        paymentWebhookEventRepository.save(event);

        return Map.of(
                "message", applied ? "Cap nhat thanh toan thanh cong" : "Khong co thay doi trang thai thanh toan",
                "duplicate", Boolean.FALSE,
                "applied", applied,
                "paymentStatus", booking.getPaymentStatus().name());
    }

    public boolean isValidSandboxCheckoutSignature(String bookingId, String txRef, double amount, String signature) {
        String expected = buildSandboxCheckoutSignature(bookingId, txRef, amount);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
    }

    public String buildSandboxWebhookSignature(String bookingId, String txRef, double amount, String status) {
        String payload = String.join(
                "|",
                requireNonBlank(bookingId, "bookingId is required"),
                requireNonBlank(txRef, "txRef is required"),
                normalizeAmountForSignature(amount),
                requireNonBlank(status, "status is required"));
        return signHmacSha256(payload, sandboxSecret);
    }

    private String buildSandboxCheckoutSignature(String bookingId, String txRef, double amount) {
        String payload = String.join(
                "|",
                requireNonBlank(bookingId, "bookingId is required"),
                requireNonBlank(txRef, "txRef is required"),
                normalizeAmountForSignature(amount));
        return signHmacSha256(payload, sandboxSecret);
    }

    private String buildSandboxCheckoutUrl(String bookingId, String txRef, double amount, String signature) {
        return backendUrl + "/payments/sandbox/checkout"
                + "?bookingId=" + encode(bookingId)
                + "&txRef=" + encode(txRef)
                + "&amount=" + encode(normalizeAmountForSignature(amount))
                + "&signature=" + encode(signature);
    }

    private boolean isValidSandboxWebhookSignature(
            String bookingId,
            String txRef,
            double amount,
            String status,
            String signature) {
        String expected = buildSandboxWebhookSignature(bookingId, txRef, amount, status);
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8));
    }

    private boolean applyPaymentStatusTransition(Booking booking, PaymentStatus nextStatus, double amount) {
        PaymentStatus currentStatus = booking.getPaymentStatus() == null
                ? PaymentStatus.PENDING
                : booking.getPaymentStatus();

        if (nextStatus == PaymentStatus.PAID && currentStatus == PaymentStatus.PAID) {
            return false;
        }

        if (nextStatus == PaymentStatus.FAILED && currentStatus != PaymentStatus.PENDING) {
            return false;
        }

        booking.setPaymentStatus(nextStatus);
        booking.setUpdatedAt(LocalDateTime.now());

        if (nextStatus == PaymentStatus.PAID) {
            booking.setPaidAt(booking.getPaidAt() == null ? LocalDateTime.now() : booking.getPaidAt());
        } else if (nextStatus == PaymentStatus.FAILED) {
            booking.setPaidAt(null);
        }

        Booking savedBooking = bookingRepository.save(booking);
        User systemUser = userRepository.findByEmail("system@hotelbooking.local").orElse(null);

        auditLogService.record(
                "PAYMENT_WEBHOOK",
                "BOOKING",
                savedBooking.getId(),
                systemUser,
                "Webhook " + SANDBOX_PROVIDER + " cap nhat payment sang " + nextStatus.name() + ", amount=" + amount);

        notificationService.createForUser(
                savedBooking.getUserId(),
                "BOOKING_PAYMENT",
                "Cap nhat thanh toan booking",
                "Booking " + savedBooking.getId() + " da cap nhat trang thai thanh toan: " + nextStatus.name(),
                "BOOKING",
                savedBooking.getId(),
                true);

        return true;
    }

    private String buildWebhookEventKey(String transactionRef) {
        return SANDBOX_PROVIDER + ":" + transactionRef;
    }

    private String normalizeWebhookStatus(String status) {
        String normalized = requireNonBlank(status, "status is required").trim().toUpperCase();
        if (!STATUS_SUCCESS.equals(normalized) && !STATUS_FAILED.equals(normalized)) {
            throw new BadRequestException("Trang thai webhook khong hop le");
        }
        return normalized;
    }

    private String normalizeAmountForSignature(double amount) {
        return String.format(java.util.Locale.US, "%.0f", Math.max(amount, 0));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String signHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] digest = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception exception) {
            throw new BadRequestException("Khong the ky giao dich thanh toan");
        }
    }

    private String toHex(byte[] bytes) {
        StringBuilder builder = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            builder.append(String.format("%02x", value));
        }
        return builder.toString();
    }

    private double resolveFinalPrice(Booking booking) {
        double finalPrice = booking.getFinalPrice();
        if (finalPrice > 0) {
            return finalPrice;
        }

        return Math.max(booking.getTotalPrice(), 0);
    }

    private Booking getBookingById(String bookingId) {
        return bookingRepository.findById(requireNonBlank(bookingId, "Booking id is required"))
                .orElseThrow(() -> new NotFoundException("Booking not found"));
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private void assertBookingVisible(User user, Booking booking) {
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (!Objects.equals(user.getId(), booking.getUserId())) {
            throw new ForbiddenException("Ban khong co quyen thanh toan booking nay");
        }
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }

        return value;
    }
}
