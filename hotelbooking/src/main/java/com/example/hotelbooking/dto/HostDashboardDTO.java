package com.example.hotelbooking.dto;

import java.util.ArrayList;
import java.util.List;

public class HostDashboardDTO {

    private long totalHotels;
    private long totalRooms;
    private long totalBookings;
    private long upcomingBookings;
    private long activeBookings;
    private long completedBookings;
    private long cancelledBookings;
    private double totalRevenue;
    private List<HostBookingItemDTO> recentBookings = new ArrayList<>();

    public long getTotalHotels() {
        return totalHotels;
    }

    public void setTotalHotels(long totalHotels) {
        this.totalHotels = totalHotels;
    }

    public long getTotalRooms() {
        return totalRooms;
    }

    public void setTotalRooms(long totalRooms) {
        this.totalRooms = totalRooms;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getUpcomingBookings() {
        return upcomingBookings;
    }

    public void setUpcomingBookings(long upcomingBookings) {
        this.upcomingBookings = upcomingBookings;
    }

    public long getActiveBookings() {
        return activeBookings;
    }

    public void setActiveBookings(long activeBookings) {
        this.activeBookings = activeBookings;
    }

    public long getCompletedBookings() {
        return completedBookings;
    }

    public void setCompletedBookings(long completedBookings) {
        this.completedBookings = completedBookings;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public List<HostBookingItemDTO> getRecentBookings() {
        return recentBookings;
    }

    public void setRecentBookings(List<HostBookingItemDTO> recentBookings) {
        this.recentBookings = recentBookings == null ? new ArrayList<>() : new ArrayList<>(recentBookings);
    }
}