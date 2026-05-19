package com.example.hotelbooking.service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.HostBookingItemDTO;
import com.example.hotelbooking.dto.HostDashboardDTO;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.PaymentStatus;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

import java.time.LocalDate;

@Service
public class HostDashboardService {

    private static final int RECENT_BOOKING_LIMIT = 20;

    private final HostAccessService hostAccessService;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final RoomRepository roomRepository;
    private final BookingRepository bookingRepository;

    public HostDashboardService(
            HostAccessService hostAccessService,
            UserRepository userRepository,
            HotelRepository hotelRepository,
            RoomRepository roomRepository,
            BookingRepository bookingRepository) {
        this.hostAccessService = hostAccessService;
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.bookingRepository = bookingRepository;
    }

    public HostDashboardDTO getDashboard(String email) {
        User user = hostAccessService.requireCurrentUser(email);

        List<Hotel> hotels = hostAccessService.isAdmin(user)
                ? hotelRepository.findAll()
                : hotelRepository.findByOwnerId(hostAccessService.requireUserId(user));

        List<Room> rooms = hostAccessService.isAdmin(user)
                ? roomRepository.findAll()
                : roomRepository.findByOwnerId(hostAccessService.requireUserId(user));

        List<String> roomIds = rooms.stream()
                .map(Room::getId)
                .filter(Objects::nonNull)
                .toList();

        List<Booking> bookings = roomIds.isEmpty() ? List.of() : bookingRepository.findByRoomIdIn(roomIds);

        LocalDate today = LocalDate.now();

        long upcomingBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CONFIRMED)
                .filter(booking -> booking.getCheckInDate() != null && booking.getCheckInDate().isAfter(today))
                .count();

        long activeBookings = bookings.stream()
                .filter((booking) -> {
                    if (booking.getStatus() == BookingStatus.CHECKED_IN) {
                        return true;
                    }

                    if (booking.getStatus() != BookingStatus.CONFIRMED) {
                        return false;
                    }

                    LocalDate checkIn = booking.getCheckInDate();
                    LocalDate checkOut = booking.getCheckOutDate();
                    return checkIn != null && checkOut != null && !today.isBefore(checkIn) && today.isBefore(checkOut);
                })
                .count();

        long completedBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CHECKED_OUT)
                .count();

        long cancelledBookings = bookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.CANCELLED)
                .count();

        double totalRevenue = bookings.stream()
                .mapToDouble(this::resolveRevenue)
                .sum();

        Map<String, Hotel> hotelById = hotels.stream()
                .filter(hotel -> hotel.getId() != null)
                .collect(Collectors.toMap(Hotel::getId, Function.identity(), (left, right) -> left));

        Map<String, Room> roomById = rooms.stream()
                .filter(room -> room.getId() != null)
                .collect(Collectors.toMap(Room::getId, Function.identity(), (left, right) -> left));

        List<String> bookingUserIds = bookings.stream()
                .map(Booking::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<String, User> userById = userRepository.findAllById(
                        Objects.requireNonNull(bookingUserIds, "Booking user ids are required"))
                .stream()
                .filter(account -> account.getId() != null)
                .collect(Collectors.toMap(User::getId, Function.identity(), (left, right) -> left));

        List<HostBookingItemDTO> recentBookings = bookings.stream()
                .sorted(Comparator.comparing(
                        Booking::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(RECENT_BOOKING_LIMIT)
                .map((booking) -> toBookingItem(booking, roomById, hotelById, userById))
                .toList();

        HostDashboardDTO dashboard = new HostDashboardDTO();
        dashboard.setTotalHotels(hotels.size());
        dashboard.setTotalRooms(rooms.size());
        dashboard.setTotalBookings(bookings.size());
        dashboard.setUpcomingBookings(upcomingBookings);
        dashboard.setActiveBookings(activeBookings);
        dashboard.setCompletedBookings(completedBookings);
        dashboard.setCancelledBookings(cancelledBookings);
        dashboard.setTotalRevenue(totalRevenue);
        dashboard.setRecentBookings(recentBookings);

        return dashboard;
    }

    private HostBookingItemDTO toBookingItem(
            Booking booking,
            Map<String, Room> roomById,
            Map<String, Hotel> hotelById,
            Map<String, User> userById) {

        Room room = roomById.get(booking.getRoomId());
        Hotel hotel = room == null ? null : hotelById.get(room.getHotelId());
        User guest = userById.get(booking.getUserId());

        HostBookingItemDTO item = new HostBookingItemDTO();
        item.setBookingId(booking.getId());
        item.setRoomId(booking.getRoomId());
        item.setRoomName(room == null ? null : room.getName());
        item.setHotelId(room == null ? null : room.getHotelId());
        item.setHotelName(hotel == null ? null : hotel.getName());
        item.setUserId(booking.getUserId());
        item.setUserName(resolveUserName(guest));
        item.setStatus(booking.getStatus() == null ? null : booking.getStatus().name());
        item.setPaymentStatus(booking.getPaymentStatus() == null ? null : booking.getPaymentStatus().name());
        item.setCheckInDate(booking.getCheckInDate());
        item.setCheckOutDate(booking.getCheckOutDate());
        item.setFinalPrice(resolveFinalPrice(booking));
        item.setCreatedAt(booking.getCreatedAt());
        return item;
    }

    private String resolveUserName(User user) {
        if (user == null) {
            return null;
        }

        if (hasText(user.getName())) {
            return user.getName().trim();
        }

        return trimToNull(user.getEmail());
    }

    private double resolveFinalPrice(Booking booking) {
        if (booking.getFinalPrice() > 0) {
            return booking.getFinalPrice();
        }

        return booking.getTotalPrice();
    }

    private double resolveRevenue(Booking booking) {
        double gross = resolveFinalPrice(booking);
        double refund = Math.max(booking.getRefundAmount(), 0);

        if (booking.getStatus() == BookingStatus.CANCELLED && booking.getPaymentStatus() == PaymentStatus.PENDING) {
            return 0;
        }

        return Math.max(gross - refund, 0);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
