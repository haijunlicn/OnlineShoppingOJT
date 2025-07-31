package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.ProductReviewDto;
import com.maven.OnlineShoppingSB.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    // Get reviews for a product (with pagination, sort, filter, summary)
    @GetMapping("/public/product/{productId}")
    public Map<String, Object> getProductReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "date_desc") String sort,
            @RequestParam(required = false) Integer rating
    ) {
        return reviewService.getProductReviews(productId, page, size, sort, rating);
    }

    // Add a review (userId from JWT or request)
    @PostMapping
    public ProductReviewDto addReview(@RequestBody ProductReviewDto reviewDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
    Long userId = userDetails.getUser().getId();
    String userName=userDetails.getUser().getName();
    // Set userId to DTO (or directly use in service)
    reviewDto.setUserId(userId);
    reviewDto.setUserName(userName);
        return reviewService.addReview(reviewDto);
    }

    // Update a review (only by owner)
    @PutMapping("/{id}")
    public ProductReviewDto updateReview(@PathVariable Long id, @RequestBody ProductReviewDto reviewDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        reviewDto.setUserId(userId); // Ensure userId is set from token
        return reviewService.updateReview(id, reviewDto);
    }

    // Delete a review (only by owner)
    @DeleteMapping("/{id}")
    public void deleteReview(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        reviewService.deleteReview(id, userId);
    }

    // Check if user can review this product (has purchased and received)
    @GetMapping("/check-purchase/{productId}")
    public Map<String, Boolean> checkPurchaseStatus(@PathVariable Long productId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUser().getId();
        
        System.out.println("🔍 Checking purchase status for User ID: " + userId + ", Product ID: " + productId);
        
        boolean canReview = reviewService.canUserReviewProduct(userId, productId);
        boolean hasReviewed = reviewService.hasUserReviewedProduct(userId, productId);
        
        System.out.println("✅ Can review result: " + canReview);
        System.out.println("✅ Has reviewed result: " + hasReviewed);
        
        return Map.of(
            "canReview", canReview,
            "hasReviewed", hasReviewed
        );
    }

    // Get all reviews for all products
    @GetMapping("/public/all")
    public List<ProductReviewDto> getAllReviews() {
        return reviewService.getAllReviews();
    }
}