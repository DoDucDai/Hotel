package com.example.hotelbooking.controller;

import com.example.hotelbooking.model.BookingStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.AdminDashboardDTO;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    public AdminController(
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository) {

        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public AdminDashboardDTO getDashboard() {

        long totalUsers = userRepository.count();
        long totalHotels = hotelRepository.count();
        long totalRooms = roomRepository.count();
        long totalBookings = bookingRepository.count();

        double revenue = bookingRepository.findAll()
                .stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .mapToDouble(b -> b.getFinalPrice() > 0 ? b.getFinalPrice() : b.getTotalPrice())
                .sum();

        return new AdminDashboardDTO(
                totalUsers,
                totalHotels,
                totalRooms,
                totalBookings,
                revenue
        );
    }
}
