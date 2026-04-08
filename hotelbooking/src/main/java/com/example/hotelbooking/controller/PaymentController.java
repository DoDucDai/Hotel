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

import com.example.hotelbooking.dto.PaymentInstructionResponse;
import com.example.hotelbooking.dto.PaymentInstructionsResponse;
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

    @GetMapping("/instructions")
    public PaymentInstructionsResponse getPaymentInstructions() {
        return paymentService.getPaymentInstructions();
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
        PaymentInstructionResponse instruction = paymentService.getInstructionForBooking(bookingId);

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
                    * { box-sizing: border-box; }
                    body {
                      margin: 0;
                      min-height: 100vh;
                      display: grid;
                      place-items: center;
                      padding: 24px;
                      font-family: "Segoe UI", Arial, sans-serif;
                      background:
                        radial-gradient(circle at top left, rgba(30, 102, 255, 0.14), transparent 32%),
                        radial-gradient(circle at bottom right, rgba(11, 182, 160, 0.12), transparent 30%),
                        #f4f7ff;
                      color: #10213f;
                    }
                    .card {
                      width: min(760px, 100%);
                      border: 1px solid #d8e4ff;
                      border-radius: 24px;
                      padding: 28px;
                      background: rgba(255, 255, 255, 0.94);
                      box-shadow: 0 20px 46px rgba(14, 39, 84, 0.12);
                    }
                    .badge {
                      display: inline-flex;
                      align-items: center;
                      border-radius: 999px;
                      padding: 8px 14px;
                      background: #ecf3ff;
                      border: 1px solid #d8e4ff;
                      color: #2152a8;
                      font-size: 12px;
                      font-weight: 700;
                      text-transform: uppercase;
                      letter-spacing: 0.08em;
                    }
                    h1 {
                      margin: 14px 0 8px;
                      font-size: clamp(28px, 4vw, 38px);
                    }
                    .intro {
                      margin: 0;
                      color: #5f7190;
                      line-height: 1.7;
                    }
                    .summary {
                      margin-top: 20px;
                      display: grid;
                      grid-template-columns: repeat(3, minmax(0, 1fr));
                      gap: 12px;
                    }
                    .summary-item,
                    .instruction-card {
                      border: 1px solid #dce7ff;
                      border-radius: 18px;
                      background: #f9fbff;
                    }
                    .summary-item {
                      padding: 14px 16px;
                    }
                    .summary-item span {
                      display: block;
                      margin-bottom: 6px;
                      color: #5f7190;
                      font-size: 12px;
                      text-transform: uppercase;
                      letter-spacing: 0.06em;
                      font-weight: 700;
                    }
                    .summary-item strong,
                    code {
                      color: #14366a;
                      font-size: 16px;
                    }
                    code {
                      background: #edf3ff;
                      padding: 3px 8px;
                      border-radius: 8px;
                    }
                    .instruction-card {
                      margin-top: 18px;
                      padding: 18px;
                    }
                    .instruction-head {
                      display: flex;
                      align-items: center;
                      justify-content: space-between;
                      gap: 12px;
                    }
                    .instruction-head h2 {
                      margin: 0;
                      font-size: 22px;
                    }
                    .provider-chip {
                      border-radius: 999px;
                      padding: 8px 12px;
                      border: 1px solid #ffd7bd;
                      background: #fff4ea;
                      color: #b25d0f;
                      font-size: 13px;
                      font-weight: 700;
                    }
                    .instruction-grid {
                      margin-top: 14px;
                      display: grid;
                      grid-template-columns: repeat(2, minmax(0, 1fr));
                      gap: 12px;
                    }
                    .instruction-item {
                      border: 1px solid #dce7ff;
                      border-radius: 14px;
                      background: #ffffff;
                      padding: 14px;
                    }
                    .instruction-item span {
                      display: block;
                      margin-bottom: 6px;
                      color: #5f7190;
                      font-size: 12px;
                      text-transform: uppercase;
                      letter-spacing: 0.06em;
                      font-weight: 700;
                    }
                    .instruction-item strong {
                      color: #14366a;
                    }
                    .instruction-note {
                      margin: 14px 0 0;
                      color: #4f6383;
                      line-height: 1.7;
                    }
                    .actions {
                      display: flex;
                      gap: 12px;
                      margin-top: 22px;
                      flex-wrap: wrap;
                    }
                    a.btn {
                      padding: 13px 18px;
                      border-radius: 14px;
                      text-decoration: none;
                      color: #fff;
                      font-weight: 700;
                    }
                    a.success { background: linear-gradient(135deg, #0f8b55, #0c6f45); }
                    a.fail { background: linear-gradient(135deg, #d15443, #b53f31); }
                    @media (max-width: 720px) {
                      .card { padding: 22px; }
                      .summary,
                      .instruction-grid { grid-template-columns: 1fr; }
                      .instruction-head { flex-direction: column; align-items: flex-start; }
                    }
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="badge">Sandbox checkout</div>
                    <h1>""" + html(instruction.getLabel()) + "</h1>\n"
                + "    <p class=\"intro\">Mo phong giao dich online cho booking. Kiem tra dung thong tin nhan tien truoc khi danh dau ket qua thanh toan.</p>\n"
                + "    <div class=\"summary\">\n"
                + "      <div class=\"summary-item\"><span>Booking</span><strong><code>" + html(bookingId) + "</code></strong></div>\n"
                + "      <div class=\"summary-item\"><span>Transaction</span><strong><code>" + html(txRef) + "</code></strong></div>\n"
                + "      <div class=\"summary-item\"><span>Amount</span><strong>" + normalizedAmount + " VND</strong></div>\n"
                + "    </div>\n"
                + buildInstructionCard(instruction)
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

    private String buildInstructionCard(PaymentInstructionResponse instruction) {
        String providerLabel = "BANK_TRANSFER".equals(instruction.getMethod()) ? "Ngan hang" : "Vi dien tu";
        String accountLabel = "E_WALLET".equals(instruction.getMethod()) ? "So vi / SDT" : "So tai khoan";

        return "    <section class=\"instruction-card\">\n"
                + "      <div class=\"instruction-head\">\n"
                + "        <h2>Thong tin nhan tien</h2>\n"
                + "        <span class=\"provider-chip\">" + html(instruction.getProviderName()) + "</span>\n"
                + "      </div>\n"
                + "      <div class=\"instruction-grid\">\n"
                + "        <div class=\"instruction-item\"><span>" + providerLabel + "</span><strong>"
                + html(instruction.getProviderName()) + "</strong></div>\n"
                + "        <div class=\"instruction-item\"><span>" + accountLabel + "</span><strong>"
                + html(instruction.getAccountNumber()) + "</strong></div>\n"
                + "        <div class=\"instruction-item\"><span>Nguoi nhan</span><strong>"
                + html(instruction.getAccountName()) + "</strong></div>\n"
                + "        <div class=\"instruction-item\"><span>Noi dung</span><strong>"
                + html(instruction.getTransferContent()) + "</strong></div>\n"
                + "      </div>\n"
                + "      <p class=\"instruction-note\">" + html(instruction.getNote()) + "</p>\n"
                + "    </section>\n";
    }

    private String html(String value) {
        if (value == null) {
            return "-";
        }

        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
