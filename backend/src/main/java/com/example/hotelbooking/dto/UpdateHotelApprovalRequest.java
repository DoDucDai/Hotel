package com.example.hotelbooking.dto;

import com.example.hotelbooking.model.HotelApprovalStatus;

public class UpdateHotelApprovalRequest {

    private HotelApprovalStatus status;
    private String note;

    public HotelApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(HotelApprovalStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
