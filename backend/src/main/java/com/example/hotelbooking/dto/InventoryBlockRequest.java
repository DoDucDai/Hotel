package com.example.hotelbooking.dto;

import java.time.LocalDate;

public class InventoryBlockRequest {

    private LocalDate startDate;
    private LocalDate endDate;
    private int blockedUnits;
    private String reason;

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public int getBlockedUnits() {
        return blockedUnits;
    }

    public void setBlockedUnits(int blockedUnits) {
        this.blockedUnits = blockedUnits;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
