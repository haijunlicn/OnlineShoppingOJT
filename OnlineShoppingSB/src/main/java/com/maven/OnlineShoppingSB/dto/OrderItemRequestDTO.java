package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.DiscountType;
import com.maven.OnlineShoppingSB.entity.MechanismType;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@ToString
public class OrderItemRequestDTO {
    private Long id;
    private Long orderId;
    private Long variantId;
    private Integer quantity;
    private double price;
    private List<OrderItemDiscountMechanismDTO> appliedDiscounts;

    @Getter
    @Setter
    @ToString
    public static class OrderItemDiscountMechanismDTO {
        private Long discountMechanismId;
        private MechanismType mechanismType;  // enum e.g. DISCOUNT, COUPON
        private DiscountType discountType;    // enum e.g. PERCENTAGE, FIXED
        private double discountAmount;        // base discount amount per item
        private String couponCode;            // nullable, only for coupons
        private String description;
    }
}
