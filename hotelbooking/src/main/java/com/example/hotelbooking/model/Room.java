package com.example.hotelbooking.model;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Transient;
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

    private String roomType = "STANDARD";

    private String bedType;

    private String description;

    @Min(1)
    private int totalUnits = 1;

    private List<String> amenities = new ArrayList<>();

    @Transient
    private int availableUnits = 1;

    @Transient
    private int bookedUnits;

    @Transient
    private int blockedUnits;

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

    public String getRoomType() {
        return roomType;
    }

    public void setRoomType(String roomType) {
        this.roomType = roomType;
    }

    public String getBedType() {
        return bedType;
    }

    public void setBedType(String bedType) {
        this.bedType = bedType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getTotalUnits() {
        return totalUnits;
    }

    public void setTotalUnits(int totalUnits) {
        this.totalUnits = totalUnits;
    }

    public List<String> getAmenities() {
        if (amenities == null) {
            amenities = new ArrayList<>();
        }
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities == null ? new ArrayList<>() : new ArrayList<>(amenities);
    }

    public int getAvailableUnits() {
        return availableUnits;
    }

    public void setAvailableUnits(int availableUnits) {
        this.availableUnits = availableUnits;
    }

    public int getBookedUnits() {
        return bookedUnits;
    }

    public void setBookedUnits(int bookedUnits) {
        this.bookedUnits = bookedUnits;
    }

    public int getBlockedUnits() {
        return blockedUnits;
    }

    public void setBlockedUnits(int blockedUnits) {
        this.blockedUnits = blockedUnits;
    }
}
