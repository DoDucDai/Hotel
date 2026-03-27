package com.example.hotelbooking.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.hotelbooking.dto.CreateReviewRequest;
import com.example.hotelbooking.model.Review;
import com.example.hotelbooking.service.ReviewService;

@RestController
@RequestMapping("/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public List<Review> getReviewsByHotel(@RequestParam String hotelId) {
        return reviewService.getReviewsByHotel(hotelId);
    }

    @PostMapping
    public Review createReview(
            @RequestBody CreateReviewRequest request,
            Authentication authentication) {

        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }

        return reviewService.createReview(authentication.getName(), request);
    }
}
