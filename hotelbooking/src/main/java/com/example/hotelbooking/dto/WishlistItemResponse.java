package com.example.hotelbooking.dto;

import java.time.LocalDateTime;

import com.example.hotelbooking.model.Hotel;

public class WishlistItemResponse {

    private final String hotelId;
    private final LocalDateTime createdAt;
    private final Hotel hotel;

    public WishlistItemResponse(String hotelId, LocalDateTime createdAt, Hotel hotel) {
        this.hotelId = hotelId;
        this.createdAt = createdAt;
        this.hotel = hotel;
    }

    public String getHotelId() {
        return hotelId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public Hotel getHotel() {
        return hotel;
    }
}
