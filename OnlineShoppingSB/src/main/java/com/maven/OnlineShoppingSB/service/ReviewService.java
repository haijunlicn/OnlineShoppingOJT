package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.ProductReviewDto;
import com.maven.OnlineShoppingSB.dto.ProductReviewImageDto;
import com.maven.OnlineShoppingSB.entity.OrderItemEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.ProductReview;
import com.maven.OnlineShoppingSB.entity.ProductReviewImage;
import com.maven.OnlineShoppingSB.repository.OrderItemRepository;
import com.maven.OnlineShoppingSB.repository.ProductRepository;
import com.maven.OnlineShoppingSB.repository.ProductReviewImageRepository;
import com.maven.OnlineShoppingSB.repository.ProductReviewRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    @Autowired
    private ProductReviewRepository reviewRepo;

    @Autowired
    private ProductReviewImageRepository imageRepo;

    @Autowired
    private OrderItemRepository orderItemRepo;

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private ProductRepository productRepo;

    // Get reviews for a product (with pagination, sort, filter, summary)
    public Map<String, Object> getProductReviews(Long productId, int page, int size, String sort, Integer rating) {
        Sort.Direction direction = sort.contains("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = sort.contains("rating") ? "rating" : "createdDate";
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(direction, sortField));

        Page<ProductReview> reviewPage;
        if (rating != null) {
            reviewPage = reviewRepo.findByProductIdAndRating(productId, rating, pageable);
        } else {
            reviewPage = reviewRepo.findByProductId(productId, pageable);
        }

        List<ProductReviewDto> reviewDtos = reviewPage.getContent().stream().map(this::toDto).collect(Collectors.toList());

        // Calculate average and breakdown
        List<ProductReview> allReviews = reviewRepo.findByProductId(productId);
        double average = allReviews.stream().mapToInt(ProductReview::getRating).average().orElse(0.0);
        Map<Integer, Long> breakdown = allReviews.stream().collect(Collectors.groupingBy(ProductReview::getRating, Collectors.counting()));

        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviewDtos);
        result.put("total", reviewPage.getTotalElements());
        result.put("average", average);
        result.put("breakdown", breakdown);
        return result;
    }

    // Add a review
    public ProductReviewDto addReview(ProductReviewDto dto) {
        // Check if user has already reviewed this product
        if (reviewRepo.existsByUserIdAndProductId(dto.getUserId(), dto.getProductId())) {
            throw new RuntimeException("You are not allowed to give review again");
        }
        // Check if user has purchased and received this product (DELIVERED status)
        boolean hasPurchasedAndDelivered = orderItemRepo.existsByOrderUserIdAndVariantProductIdAndOrderStatus(
            dto.getUserId(), dto.getProductId(), "DELIVERED"
        );
        
        if (!hasPurchasedAndDelivered) {
            throw new RuntimeException("You can only review products that have been delivered to you");
        }
        
        ProductReview review = new ProductReview();
        review.setUser(userRepo.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found")));
        review.setProduct(productRepo.findById(dto.getProductId()).orElseThrow(() -> new RuntimeException("Product not found")));
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setCreatedDate(java.time.LocalDateTime.now());
        review.setUpdatedDate(java.time.LocalDateTime.now());
        review = reviewRepo.save(review);

        // Save images if any
        if (dto.getImages() != null) {
            for (ProductReviewImageDto imgDto : dto.getImages()) {
                ProductReviewImage img = new ProductReviewImage();
                img.setImageUrl(imgDto.getImageUrl());
                img.setReview(review);
                imageRepo.save(img);
            }
        }
        return toDto(review);
    }

    // Update a review
    public ProductReviewDto updateReview(Long id, ProductReviewDto dto) {
        ProductReview review = reviewRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        if (!review.getUser().getId().equals(dto.getUserId())) {
            throw new RuntimeException("You can only edit your own review");
        }
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setUpdatedDate(java.time.LocalDateTime.now());

        // Remove all old images (clear list)
        if (review.getImages() != null) {
            review.getImages().clear();
        }

        // Add new images (skip blank)
        if (dto.getImages() != null) {
            for (ProductReviewImageDto imgDto : dto.getImages()) {
                if (imgDto.getImageUrl() != null && !imgDto.getImageUrl().trim().isEmpty()) {
                    ProductReviewImage img = new ProductReviewImage();
                    img.setImageUrl(imgDto.getImageUrl());
                    img.setReview(review);
                    review.getImages().add(img);
                }
            }
        }
        review = reviewRepo.save(review);
        return toDto(review);
    }

    public void deleteReview(Long id, Long userId) {
        ProductReview review = reviewRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        if (!review.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own review");
        }
        reviewRepo.delete(review);
    }

    // Check if user can review this product
    public boolean canUserReviewProduct(Long userId, Long productId) {
        System.out.println("🔍 ReviewService: Checking for User ID: " + userId + ", Product ID: " + productId);
        
        
        List<OrderItemEntity> orderItems = orderItemRepo.findByOrderUserIdAndVariantProductId(userId, productId);
        System.out.println("📦 Found " + orderItems.size() + " order items for this product");
        
        for (OrderItemEntity item : orderItems) {
            System.out.println("📋 Order ID: " + item.getOrder().getId() + 
                             ", Status: " + item.getOrder().getCurrentStatus().getCode() + 
                             ", Label: " + item.getOrder().getCurrentStatus().getLabel());
        }
        
        // Try
        boolean result = orderItemRepo.existsByOrderUserIdAndVariantProductIdAndOrderStatus(
            userId, productId, "DELIVERED"
        );
        
        // If not found, try alternative status codes
        if (!result) {
            result = orderItemRepo.existsByOrderUserIdAndVariantProductIdAndOrderStatus(
                userId, productId, "delivered"
            );
        }
        
        if (!result) {
            result = orderItemRepo.existsByOrderUserIdAndVariantProductIdAndOrderStatus(
                userId, productId, "Delivered"
            );
        }
        
        System.out.println("✅ ReviewService: Can review result: " + result);
        
        return result;
    }

    // Check if user has already reviewed this product
    public boolean hasUserReviewedProduct(Long userId, Long productId) {
        return reviewRepo.existsByUserIdAndProductId(userId, productId);
    }

    public List<ProductReviewDto> getAllReviews() {
        List<ProductReview> reviews = reviewRepo.findAll();
        return reviews.stream().map(this::toDto).collect(java.util.stream.Collectors.toList());
    }

    // Convert entity to DTO (with verified badge, userName masking)
    private ProductReviewDto toDto(ProductReview review) {
        ProductReviewDto dto = new ProductReviewDto();
        dto.setId(review.getId());
        dto.setUserId(review.getUser().getId());
        dto.setProductId(review.getProduct().getId());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedDate(review.getCreatedDate());
        dto.setUpdatedDate(review.getUpdatedDate());
        // Images
        List<ProductReviewImageDto> images = review.getImages().stream().map(img -> {
            ProductReviewImageDto imgDto = new ProductReviewImageDto();
            imgDto.setId(img.getId());
            imgDto.setImageUrl(img.getImageUrl());
            return imgDto;
        }).collect(Collectors.toList());
        dto.setImages(images);

        // Verified Purchase (only if DELIVERED)
        boolean verified = orderItemRepo.existsByOrderUserIdAndVariantProductIdAndOrderStatus(
                review.getUser().getId(), review.getProduct().getId(), "DELIVERED"
        );
        dto.setVerifiedPurchase(verified);

        // Masked user name
        String name = review.getUser().getName();
        if (name != null && name.length() > 1) {
            dto.setUserName(name.charAt(0) + "***");
        } else {
            dto.setUserName("User");
        }
        return dto;
    }
}