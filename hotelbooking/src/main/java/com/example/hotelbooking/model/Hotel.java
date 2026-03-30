package com.example.hotelbooking.model;

import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hotels")
public class Hotel {

    @Id
    private String id;
    private String ownerId;
    private String name;
    private String address;
    private String city;
    private String imageUrl;
    private int starRating = 3;
    private List<String> amenities = new ArrayList<>();
    private double averageRating;
    private long reviewCount;
    private HotelApprovalStatus approvalStatus = HotelApprovalStatus.APPROVED;
    private String approvalNote;
    private String approvedByUserId;
    private LocalDateTime approvedAt;
    private int freeCancellationBeforeDays = 3;
    private int lateCancellationRefundRate = 50;

    public Hotel() {}

    public Hotel(String name, String address, String city) {
        this.name = name;
        this.address = address;
        this.city = city;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getStarRating() { return starRating; }
    public void setStarRating(int starRating) { this.starRating = starRating; }

    public List<String> getAmenities() {
        if (amenities == null) {
            amenities = new ArrayList<>();
        }
        return amenities;
    }

    public void setAmenities(List<String> amenities) {
        this.amenities = amenities == null ? new ArrayList<>() : new ArrayList<>(amenities);
    }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public long getReviewCount() { return reviewCount; }
    public void setReviewCount(long reviewCount) { this.reviewCount = reviewCount; }

    public HotelApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(HotelApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getApprovalNote() {
        return approvalNote;
    }

    public void setApprovalNote(String approvalNote) {
        this.approvalNote = approvalNote;
    }

    public String getApprovedByUserId() {
        return approvedByUserId;
    }

    public void setApprovedByUserId(String approvedByUserId) {
        this.approvedByUserId = approvedByUserId;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
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
}
