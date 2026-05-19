package com.example.hotelbooking.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.CreateReviewRequest;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.ForbiddenException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.Booking;
import com.example.hotelbooking.model.BookingStatus;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.Review;
import com.example.hotelbooking.model.Room;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.repository.BookingRepository;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.ReviewRepository;
import com.example.hotelbooking.repository.RoomRepository;
import com.example.hotelbooking.repository.UserRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            RoomRepository roomRepository,
            HotelRepository hotelRepository,
            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.userRepository = userRepository;
    }

    public List<Review> getReviewsByHotel(String hotelId) {
        return reviewRepository.findByHotelIdOrderByCreatedAtDesc(requireNonBlank(hotelId, "Hotel id is required"));
    }

    public Review createReview(String email, CreateReviewRequest request) {
        CreateReviewRequest safeRequest = java.util.Objects.requireNonNull(request, "Review request is required");
        User user = getCurrentUser(email);

        String bookingId = requireNonBlank(safeRequest.getBookingId(), "bookingId is required");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking khong ton tai"));

        if (!user.getId().equals(booking.getUserId())) {
            throw new ForbiddenException("Ban khong the danh gia booking nay");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Khong the danh gia booking da bi huy");
        }

        LocalDate checkOutDate = booking.getCheckOutDate();
        if (checkOutDate == null || LocalDate.now().isBefore(checkOutDate)) {
            throw new BadRequestException("Chi co the danh gia sau khi ket thuc luu tru");
        }

        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new BadRequestException("Booking nay da duoc danh gia");
        }

        int rating = safeRequest.getRating();
        if (rating < 1 || rating > 5) {
            throw new BadRequestException("Danh gia phai tu 1 den 5 sao");
        }

        Room room = roomRepository.findById(requireNonBlank(booking.getRoomId(), "Room id is required"))
                .orElseThrow(() -> new NotFoundException("Room khong ton tai"));

        Hotel hotel = hotelRepository.findById(requireNonBlank(room.getHotelId(), "Hotel id is required"))
                .orElseThrow(() -> new NotFoundException("Hotel khong ton tai"));

        Review review = new Review();
        review.setHotelId(hotel.getId());
        review.setBookingId(bookingId);
        review.setUserId(user.getId());
        review.setUserName(resolveDisplayName(user));
        review.setRating(rating);
        review.setComment(trimToNull(safeRequest.getComment()));
        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);
        refreshHotelRating(hotel.getId());
        return savedReview;
    }

    private void refreshHotelRating(String hotelId) {
        String normalizedHotelId = requireNonBlank(hotelId, "Hotel id is required");

        Hotel hotel = hotelRepository.findById(normalizedHotelId)
                .orElseThrow(() -> new NotFoundException("Hotel khong ton tai"));

        List<Review> reviews = reviewRepository.findByHotelIdOrderByCreatedAtDesc(normalizedHotelId);
        double averageRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0);

        hotel.setAverageRating(Math.round(averageRating * 10.0) / 10.0);
        hotel.setReviewCount(reviews.size());
        hotelRepository.save(hotel);
    }

    private User getCurrentUser(String email) {
        String normalizedEmail = requireNonBlank(email, "Unauthorized");
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private String resolveDisplayName(User user) {
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }

        String email = user.getEmail();
        if (email == null || email.isBlank()) {
            return "Nguoi dung";
        }

        int splitIndex = email.indexOf('@');
        return splitIndex > 0 ? email.substring(0, splitIndex) : email;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private @NonNull String requireNonBlank(String value, @NonNull String message) {
        if (value == null || value.isBlank()) {
            if ("Unauthorized".equalsIgnoreCase(message)) {
                throw new UnauthorizedException(message);
            }

            throw new BadRequestException(message);
        }

        return value;
    }
}
