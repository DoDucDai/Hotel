package com.example.hotelbooking.dto;

import java.time.LocalDate;

public class RoomInventoryDayDTO {

    private LocalDate date;
    private int totalUnits;
    private int bookedUnits;
    private int blockedUnits;
    private int availableUnits;

    public RoomInventoryDayDTO(
            LocalDate date,
            int totalUnits,
            int bookedUnits,
            int blockedUnits,
            int availableUnits) {
        this.date = date;
        this.totalUnits = totalUnits;
        this.bookedUnits = bookedUnits;
        this.blockedUnits = blockedUnits;
        this.availableUnits = availableUnits;
    }

    public LocalDate getDate() {
        return date;
    }

    public int getTotalUnits() {
        return totalUnits;
    }

    public int getBookedUnits() {
        return bookedUnits;
    }

    public int getBlockedUnits() {
        return blockedUnits;
    }

    public int getAvailableUnits() {
        return availableUnits;
    }
}
