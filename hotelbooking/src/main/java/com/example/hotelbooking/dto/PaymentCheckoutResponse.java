package com.example.hotelbooking.dto;

public class PaymentCheckoutResponse {

    private String bookingId;
    private String provider;
    private String transactionRef;
    private String checkoutUrl;
    private double amount;
    private String currency;
    private String paymentMethod;
    private PaymentInstructionResponse instruction;

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getTransactionRef() {
        return transactionRef;
    }

    public void setTransactionRef(String transactionRef) {
        this.transactionRef = transactionRef;
    }

    public String getCheckoutUrl() {
        return checkoutUrl;
    }

    public void setCheckoutUrl(String checkoutUrl) {
        this.checkoutUrl = checkoutUrl;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentInstructionResponse getInstruction() {
        return instruction;
    }

    public void setInstruction(PaymentInstructionResponse instruction) {
        this.instruction = instruction;
    }
}
