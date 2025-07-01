package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OrderItemDetailDto {
    private Long id;
    private Integer quantity;
    private Double price;
    private Double totalPrice;
    
    // Product variant information
    private ProductVariantDTO variant;
    
    // Product information
    private ProductDTO product;
} 