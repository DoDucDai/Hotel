package com.example.hotelbooking.config;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.service.AuditLogService;
import com.example.hotelbooking.service.NotificationService;

@Component
public class ExpiredBookingScheduler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExpiredBookingScheduler.class);

    private final BookingRepository bookingRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public ExpiredBookingScheduler(
            BookingRepository bookingRepository,
            AuditLogService auditLogService,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    // Runs every 1 minute to check for payment timeouts
    @Scheduled(fixedDelay = 60000)
    public void releaseExpiredPendingPayments() {
        LocalDateTime limit = LocalDateTime.now().minusMinutes(15);
        
        List<Booking> expiredBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .filter(b -> b.getPaymentStatus() == PaymentStatus.PENDING)
                .filter(b -> b.getPaymentMethod() != PaymentMethod.PAY_AT_HOTEL)
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().isBefore(limit))
                .toList();

        if (expiredBookings.isEmpty()) {
            return;
        }

        LOGGER.info("Found {} expired pending-payment bookings. Cancelling and releasing inventory...", expiredBookings.size());

        for (Booking booking : expiredBookings) {
            try {
                booking.setStatus(BookingStatus.CANCELLED);
                booking.setCancellationReason("Thanh toán hết hạn (15 phút)");
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);

                LOGGER.info("Cancelled booking ID: {} due to payment timeout", booking.getId());

                auditLogService.record(
                        "AUTO_CANCEL_EXPIRED_PAYMENT",
                        "BOOKING",
                        booking.getId(),
                        null,
                        "Tu dong huy booking do het han thanh toan 15 phut"
                );

                notificationService.createForUser(
                        booking.getUserId(),
                        "BOOKING",
                        "Đặt phòng bị hủy do hết hạn thanh toán",
                        "Booking " + booking.getId() + " đã tự động bị hủy do bạn không hoàn tất thanh toán trong 15 phút.",
                        "BOOKING",
                        booking.getId(),
                        true
                );
            } catch (Exception e) {
                LOGGER.error("Failed to cancel expired booking {}", booking.getId(), e);
            }
        }
    }
}
