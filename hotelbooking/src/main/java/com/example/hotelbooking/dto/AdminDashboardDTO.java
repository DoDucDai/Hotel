package com.example.hotelbooking.dto;

public class AdminDashboardDTO {

    private long totalUsers;
    private long totalHotels;
    private long totalRooms;
    private long totalBookings;
    private double totalRevenue;

    public AdminDashboardDTO(long totalUsers, long totalHotels,
                             long totalRooms, long totalBookings,
                             double totalRevenue) {
        this.totalUsers = totalUsers;
        this.totalHotels = totalHotels;
        this.totalRooms = totalRooms;
        this.totalBookings = totalBookings;
        this.totalRevenue = totalRevenue;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getTotalHotels() {
        return totalHotels;
    }

    public long getTotalRooms() {
        return totalRooms;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }
}