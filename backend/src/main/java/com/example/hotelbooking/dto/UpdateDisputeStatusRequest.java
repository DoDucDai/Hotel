package com.example.hotelbooking.dto;

import com.example.hotelbooking.model.DisputeStatus;

public class UpdateDisputeStatusRequest {

    private DisputeStatus status;
    private String resolutionNote;

    public DisputeStatus getStatus() {
        return status;
    }

    public void setStatus(DisputeStatus status) {
        this.status = status;
    }

    public String getResolutionNote() {
        return resolutionNote;
    }

    public void setResolutionNote(String resolutionNote) {
        this.resolutionNote = resolutionNote;
    }
}
