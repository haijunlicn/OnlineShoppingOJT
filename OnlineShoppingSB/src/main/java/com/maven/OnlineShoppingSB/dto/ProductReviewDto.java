package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ProductReviewDto {
    private Long id;
    private Long userId;
    private Long productId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private List<ProductReviewImageDto> images;
    private Boolean verifiedPurchase; // <-- add this
    private String userName; 
}
