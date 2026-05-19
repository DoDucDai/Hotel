package com.example.hotelbooking.dto;

import com.example.hotelbooking.model.BookingStatus;

public class UpdateBookingStatusRequest {

    private BookingStatus status;
    private String note;

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
