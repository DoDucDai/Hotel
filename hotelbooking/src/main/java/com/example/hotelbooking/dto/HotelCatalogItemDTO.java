package com.example.hotelbooking.dto;

import java.util.ArrayList;
import java.util.List;

public class HotelCatalogItemDTO {

    private String id;
    private String ownerId;
    private String name;
    private String address;
    private String city;
    private String imageUrl;
    private List<String> imageUrls = new ArrayList<>();
    private int starRating;
    private List<String> amenities = new ArrayList<>();
    private double averageRating;
    private long reviewCount;
    private int freeCancellationBeforeDays;
    private int lateCancellationRefundRate;
    private double minRoomPrice;
    private int roomCount;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls == null ? new ArrayList<>() : new ArrayList<>(imageUrls);
    }

    public int getStarRating() {
        return starRating;
    }

    public void setStarRating(int starRating) {
        this.starRating = starRating;
    }

    public List<String> getAmenities() {
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities == null ? new ArrayList<>() : new ArrayList<>(amenities);
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(long reviewCount) {
        this.reviewCount = reviewCount;
    }

    public int getFreeCancellationBeforeDays() {
        return freeCancellationBeforeDays;
    }

    public void setFreeCancellationBeforeDays(int freeCancellationBeforeDays) {
        this.freeCancellationBeforeDays = freeCancellationBeforeDays;
    }

    public int getLateCancellationRefundRate() {
        return lateCancellationRefundRate;
    }

    public void setLateCancellationRefundRate(int lateCancellationRefundRate) {
        this.lateCancellationRefundRate = lateCancellationRefundRate;
    }

    public double getMinRoomPrice() {
        return minRoomPrice;
    }

    public void setMinRoomPrice(double minRoomPrice) {
        this.minRoomPrice = minRoomPrice;
    }

    public int getRoomCount() {
        return roomCount;
    }

    public void setRoomCount(int roomCount) {
        this.roomCount = roomCount;
    }
}
