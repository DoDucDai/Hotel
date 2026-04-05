package com.example.hotelbooking.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.hotelbooking.dto.WishlistItemResponse;
import com.example.hotelbooking.exception.BadRequestException;
import com.example.hotelbooking.exception.NotFoundException;
import com.example.hotelbooking.exception.UnauthorizedException;
import com.example.hotelbooking.model.Hotel;
import com.example.hotelbooking.model.User;
import com.example.hotelbooking.model.Wishlist;
import com.example.hotelbooking.repository.HotelRepository;
import com.example.hotelbooking.repository.UserRepository;
import com.example.hotelbooking.repository.WishlistRepository;

@Service
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;

    public WishlistService(
            WishlistRepository wishlistRepository,
            UserRepository userRepository,
            HotelRepository hotelRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
    }

    public List<WishlistItemResponse> getMyWishlist(String email) {
        User user = getCurrentUser(email);
        List<Wishlist> wishlistItems = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        List<String> hotelIds = wishlistItems.stream()
                .map(Wishlist::getHotelId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();

        Map<String, Hotel> hotelsById = hotelRepository.findAllById(hotelIds)
                .stream()
                .collect(Collectors.toMap(Hotel::getId, hotel -> hotel));

        return wishlistItems.stream()
                .map(item -> new WishlistItemResponse(item.getHotelId(), item.getCreatedAt(), hotelsById.get(item.getHotelId())))
                .filter(item -> item.getHotel() != null)
                .toList();
    }

    public void addToWishlist(String email, String hotelId) {
        User user = getCurrentUser(email);
        String normalizedHotelId = requireNonBlank(hotelId, "Hotel id is required");

        hotelRepository.findById(normalizedHotelId)
                .orElseThrow(() -> new NotFoundException("Hotel khong ton tai"));

        if (wishlistRepository.existsByUserIdAndHotelId(user.getId(), normalizedHotelId)) {
            return;
        }

        Wishlist wishlist = new Wishlist();
        wishlist.setUserId(user.getId());
        wishlist.setHotelId(normalizedHotelId);
        wishlist.setCreatedAt(LocalDateTime.now());
        wishlistRepository.save(wishlist);
    }

    public void removeFromWishlist(String email, String hotelId) {
        User user = getCurrentUser(email);
        wishlistRepository.deleteByUserIdAndHotelId(user.getId(), requireNonBlank(hotelId, "Hotel id is required"));
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(requireNonBlank(email, "Unauthorized"))
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private String requireNonBlank(String value, String message) {
        if (value == null || value.isBlank()) {
            if ("Unauthorized".equalsIgnoreCase(message)) {
                throw new UnauthorizedException(message);
            }

            throw new BadRequestException(message);
        }

        return value;
    }
}
