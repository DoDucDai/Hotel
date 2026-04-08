package com.example.hotelbooking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.example.hotelbooking.dto.PaymentCheckoutResponse;
import com.example.hotelbooking.dto.SandboxPaymentWebhookRequest;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.PaymentMethod;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.PaymentWebhookEvent;
import com.example.hotelbooking.model.Role;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.PaymentWebhookEventRepository;
import com.example.hotelbooking.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentWebhookEventRepository paymentWebhookEventRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    private PaymentService paymentService;

    private void initPaymentService() {
        paymentService = new PaymentService(
                bookingRepository,
                userRepository,
                paymentWebhookEventRepository,
                auditLogService,
                notificationService);

        ReflectionTestUtils.setField(paymentService, "frontendUrl", "http://localhost:5173");
        ReflectionTestUtils.setField(paymentService, "backendUrl", "http://localhost:8080");
        ReflectionTestUtils.setField(paymentService, "sandboxSecret", "unit-test-secret-123");
        ReflectionTestUtils.setField(paymentService, "manualBankProvider", "MB Bank");
        ReflectionTestUtils.setField(paymentService, "manualBankAccountName", "HOTEL BOOKING");
        ReflectionTestUtils.setField(paymentService, "manualBankAccountNumber", "123456789");
        ReflectionTestUtils.setField(paymentService, "manualWalletProvider", "MoMo");
        ReflectionTestUtils.setField(paymentService, "manualWalletAccountName", "HOTEL BOOKING");
        ReflectionTestUtils.setField(paymentService, "manualWalletAccountNumber", "123456789");
    }

    @Test
    void createSandboxCheckoutBuildsCheckoutUrlForOnlinePayment() {
        initPaymentService();

        User user = new User();
        user.setId("user-1");
        user.setEmail("user@example.com");
        user.setRole(Role.USER);

        Booking booking = new Booking();
        booking.setId("booking-1");
        booking.setUserId("user-1");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPaymentMethod(PaymentMethod.BANK_TRANSFER);
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setFinalPrice(1_200_000);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        PaymentCheckoutResponse response = paymentService.createSandboxCheckout("booking-1", "user@example.com");

        assertEquals("booking-1", response.getBookingId());
        assertEquals("SANDBOX", response.getProvider());
        assertEquals(1_200_000, response.getAmount(), 0.001);
        assertEquals("BANK_TRANSFER", response.getPaymentMethod());
        assertEquals("MB Bank", response.getInstruction().getProviderName());
        assertEquals("123456789", response.getInstruction().getAccountNumber());
        assertNotNull(response.getTransactionRef());
        assertTrue(response.getCheckoutUrl().contains("/payments/sandbox/checkout"));
    }

    @Test
    void processSandboxWebhookIsIdempotentByTransactionRef() {
        initPaymentService();

        Booking booking = new Booking();
        booking.setId("booking-2");
        booking.setUserId("user-2");
        booking.setPaymentStatus(PaymentStatus.PENDING);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setFinalPrice(500_000);

        when(bookingRepository.findById("booking-2")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer((invocation) -> invocation.getArgument(0));
        when(paymentWebhookEventRepository.save(any(PaymentWebhookEvent.class)))
                .thenAnswer((invocation) -> invocation.getArgument(0));
        when(userRepository.findByEmail("system@hotelbooking.local")).thenReturn(Optional.empty());

        String signature = paymentService.buildSandboxWebhookSignature(
                "booking-2",
                "tx-ref-1",
                500_000,
                "SUCCESS");

        SandboxPaymentWebhookRequest request = new SandboxPaymentWebhookRequest();
        request.setBookingId("booking-2");
        request.setTransactionRef("tx-ref-1");
        request.setAmount(500_000);
        request.setStatus("SUCCESS");
        request.setSignature(signature);

        when(paymentWebhookEventRepository.findByEventKey(anyString()))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(new PaymentWebhookEvent()));

        Map<String, Object> first = paymentService.processSandboxWebhook(request);
        Map<String, Object> second = paymentService.processSandboxWebhook(request);

        assertEquals(Boolean.FALSE, first.get("duplicate"));
        assertEquals(Boolean.TRUE, first.get("applied"));
        assertEquals(PaymentStatus.PAID.name(), first.get("paymentStatus"));
        assertEquals(Boolean.TRUE, second.get("duplicate"));
        assertEquals(Boolean.FALSE, second.get("applied"));
    }
}
