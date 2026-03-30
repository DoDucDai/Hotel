package com.example.hotelbooking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class RoomDTO {

    private String id;
    private String hotelId;

    @NotBlank
    private String name;

    @Min(1)
    private int capacity;

    @Min(0)
    private double price;

    private String roomType;
    private String bedType;
    private String description;
    private int totalUnits;
    private int availableUnits;

    public RoomDTO() {}

    public RoomDTO(
            String id,
            String hotelId,
            String name,
            int capacity,
            double price,
            String roomType,
            String bedType,
            String description,
            int totalUnits,
            int availableUnits) {
        this.id = id;
        this.hotelId = hotelId;
        this.name = name;
        this.capacity = capacity;
        this.price = price;
        this.roomType = roomType;
        this.bedType = bedType;
        this.description = description;
        this.totalUnits = totalUnits;
        this.availableUnits = availableUnits;
    }

    public String getId() {
        return id;
    }

    public String getHotelId() {
        return hotelId;
    }

    public String getName() {
        return name;
    }

    public int getCapacity() {
        return capacity;
    }

    public double getPrice() {
        return price;
    }

    public String getRoomType() {
        return roomType;
    }

    public String getBedType() {
        return bedType;
    }

    public String getDescription() {
        return description;
    }

    public int getTotalUnits() {
        return totalUnits;
    }

    public int getAvailableUnits() {
        return availableUnits;
    }
}
