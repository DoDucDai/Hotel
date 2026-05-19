package com.example.hotelbooking.dto;

public class PaymentInstructionsResponse {

    private PaymentInstructionResponse bankTransfer;
    private PaymentInstructionResponse eWallet;

    public PaymentInstructionResponse getBankTransfer() {
        return bankTransfer;
    }

    public void setBankTransfer(PaymentInstructionResponse bankTransfer) {
        this.bankTransfer = bankTransfer;
    }

    public PaymentInstructionResponse getEWallet() {
        return eWallet;
    }

    public void setEWallet(PaymentInstructionResponse eWallet) {
        this.eWallet = eWallet;
    }
}
