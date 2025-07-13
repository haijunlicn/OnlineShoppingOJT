package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OrderItemRequestDTO {
    private Long id;
    private Long orderId;
    private Long variantId;
    private Integer quantity;
    private double price;
}
