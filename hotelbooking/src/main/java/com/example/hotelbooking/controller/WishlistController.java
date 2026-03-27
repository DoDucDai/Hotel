package com.example.hotelbooking.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.WishlistItemResponse;
import com.example.hotelbooking.service.WishlistService;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public List<WishlistItemResponse> getMyWishlist(Authentication authentication) {
        return wishlistService.getMyWishlist(requireEmail(authentication));
    }

    @PostMapping("/{hotelId}")
    public Map<String, String> addToWishlist(
            @PathVariable String hotelId,
            Authentication authentication) {

        wishlistService.addToWishlist(requireEmail(authentication), hotelId);
        return Map.of("message", "Added to wishlist");
    }

    @DeleteMapping("/{hotelId}")
    public Map<String, String> removeFromWishlist(
            @PathVariable String hotelId,
            Authentication authentication) {

        wishlistService.removeFromWishlist(requireEmail(authentication), hotelId);
        return Map.of("message", "Removed from wishlist");
    }

    private String requireEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        return authentication.getName();
    }
}
