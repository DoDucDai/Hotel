package com.example.hotelbooking.dto;

import com.example.hotelbooking.model.PaymentStatus;

public class UpdatePaymentStatusRequest {

    private PaymentStatus paymentStatus;

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}
