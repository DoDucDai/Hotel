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

    public RoomDTO() {}

    public RoomDTO(String id, String hotelId, String name, int capacity, double price) {
        this.id = id;
        this.hotelId = hotelId;
        this.name = name;
        this.capacity = capacity;
        this.price = price;
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
}
