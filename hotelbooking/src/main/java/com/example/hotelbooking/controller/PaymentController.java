package com.example.hotelbooking.controller;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.PaymentCheckoutResponse;
import com.example.hotelbooking.dto.SandboxPaymentWebhookRequest;
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.PaymentService;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public PaymentController(
            PaymentService paymentService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.paymentService = paymentService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @PostMapping("/checkout/{bookingId}")
    public PaymentCheckoutResponse createCheckout(
            @PathVariable String bookingId,
            Authentication authentication) {
        String email = authenticationEmailResolver.requireEmail(authentication);
        return paymentService.createSandboxCheckout(bookingId, email);
    }

    @PostMapping("/webhook/sandbox")
    public Map<String, Object> handleSandboxWebhook(@RequestBody SandboxPaymentWebhookRequest request) {
        return paymentService.processSandboxWebhook(request);
    }

    @GetMapping(value = "/sandbox/checkout", produces = MediaType.TEXT_HTML_VALUE)
    public String sandboxCheckout(
            @RequestParam String bookingId,
            @RequestParam String txRef,
            @RequestParam double amount,
            @RequestParam String signature) {
        if (!paymentService.isValidSandboxCheckoutSignature(bookingId, txRef, amount, signature)) {
            return "<html><body><h2>Invalid payment signature</h2></body></html>";
        }

        String normalizedAmount = String.format(Locale.US, "%.0f", Math.max(amount, 0));

        String successSignature = paymentService.buildSandboxWebhookSignature(
                bookingId,
                txRef,
                amount,
                "SUCCESS");
        String failedSignature = paymentService.buildSandboxWebhookSignature(
                bookingId,
                txRef,
                amount,
                "FAILED");

        String successUrl = "/payments/sandbox/complete"
                + "?bookingId=" + encode(bookingId)
                + "&txRef=" + encode(txRef)
                + "&amount=" + encode(normalizedAmount)
                + "&status=SUCCESS"
                + "&signature=" + encode(successSignature);

        String failedUrl = "/payments/sandbox/complete"
                + "?bookingId=" + encode(bookingId)
                + "&txRef=" + encode(txRef)
                + "&amount=" + encode(normalizedAmount)
                + "&status=FAILED"
                + "&signature=" + encode(failedSignature);

        return """
                <html>
                <head>
                  <meta charset="UTF-8" />
                  <title>Sandbox Checkout</title>
                  <style>
                    body { font-family: Segoe UI, Arial, sans-serif; max-width: 720px; margin: 40px auto; padding: 24px; }
                    .card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; }
                    .actions { display: flex; gap: 12px; margin-top: 20px; }
                    a.btn { padding: 10px 16px; border-radius: 8px; text-decoration: none; color: #fff; }
                    a.success { background: #0a7f4f; }
                    a.fail { background: #c0392b; }
                    code { background: #f5f5f5; padding: 2px 6px; border-radius: 6px; }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <h2>Sandbox Payment</h2>
                    <p>Booking: <code>""" + bookingId + "</code></p>\n"
                + "    <p>Transaction: <code>" + txRef + "</code></p>\n"
                + "    <p>Amount: <strong>" + normalizedAmount + " VND</strong></p>\n"
                + "    <div class=\"actions\">\n"
                + "      <a class=\"btn success\" href=\"" + successUrl + "\">Thanh toan thanh cong</a>\n"
                + "      <a class=\"btn fail\" href=\"" + failedUrl + "\">Thanh toan that bai</a>\n"
                + "    </div>\n"
                + "  </div>\n"
                + "</body></html>";
    }

    @GetMapping("/sandbox/complete")
    public ResponseEntity<Void> sandboxComplete(
            @RequestParam String bookingId,
            @RequestParam String txRef,
            @RequestParam double amount,
            @RequestParam String status,
            @RequestParam String signature) {
        String paymentStatus = "FAILED";

        try {
            SandboxPaymentWebhookRequest request = new SandboxPaymentWebhookRequest();
            request.setBookingId(bookingId);
            request.setTransactionRef(txRef);
            request.setAmount(amount);
            request.setStatus(status);
            request.setSignature(signature);

            Map<String, Object> result = paymentService.processSandboxWebhook(request);
            Object responseStatus = result.get("paymentStatus");
            if (responseStatus instanceof String value && !value.isBlank()) {
                paymentStatus = value;
            }
        } catch (Exception ignored) {
            paymentStatus = "FAILED";
        }

        String redirectUrl = frontendUrl
                + "/account?focus=payments&paymentStatus=" + encode(paymentStatus)
                + "&bookingId=" + encode(bookingId);

        return ResponseEntity.status(302).location(URI.create(redirectUrl)).build();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
