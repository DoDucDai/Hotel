package com.example.hotelbooking.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

@Document(collection = "rooms")
@JsonPropertyOrder({ "id", "ownerId", "hotelId", "name", "capacity", "price" })
public class Room {

    @Id
    private String id;
    private String ownerId;

    private String hotelId;

    @NotBlank
    private String name;

    @Min(1)
    private int capacity;

    @Min(0)
    private double price;

    public Room() {}

    public Room(String hotelId, String name, int capacity, double price) {
        this.hotelId = hotelId;
        this.name = name;
        this.capacity = capacity;
        this.price = price;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getHotelId() {
        return hotelId;
    }

    public void setHotelId(String hotelId) {
        this.hotelId = hotelId;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }
}
