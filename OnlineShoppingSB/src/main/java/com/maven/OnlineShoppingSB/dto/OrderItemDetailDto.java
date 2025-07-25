package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class OrderItemDetailDto {
    private Long id;
    private Integer quantity;
    private Double price;
    private Double totalPrice;
    private int maxReturnQty;
    private ProductVariantDTO variant;
    private ProductDTO product;
    private List<OrderItemRequestDTO.OrderItemDiscountMechanismDTO> appliedDiscounts;
} 