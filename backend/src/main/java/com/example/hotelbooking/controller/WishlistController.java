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
import com.example.hotelbooking.security.AuthenticationEmailResolver;
import com.example.hotelbooking.service.WishlistService;

@RestController
@RequestMapping("/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    private final AuthenticationEmailResolver authenticationEmailResolver;

    public WishlistController(
            WishlistService wishlistService,
            AuthenticationEmailResolver authenticationEmailResolver) {
        this.wishlistService = wishlistService;
        this.authenticationEmailResolver = authenticationEmailResolver;
    }

    @GetMapping
    public List<WishlistItemResponse> getMyWishlist(Authentication authentication) {
        return wishlistService.getMyWishlist(authenticationEmailResolver.requireEmail(authentication));
    }

    @PostMapping("/{hotelId}")
    public Map<String, String> addToWishlist(
            @PathVariable String hotelId,
            Authentication authentication) {

        wishlistService.addToWishlist(authenticationEmailResolver.requireEmail(authentication), hotelId);
        return Map.of("message", "Added to wishlist");
    }

    @DeleteMapping("/{hotelId}")
    public Map<String, String> removeFromWishlist(
            @PathVariable String hotelId,
            Authentication authentication) {

        wishlistService.removeFromWishlist(authenticationEmailResolver.requireEmail(authentication), hotelId);
        return Map.of("message", "Removed from wishlist");
    }
}
