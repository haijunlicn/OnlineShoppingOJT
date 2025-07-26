package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "order_item_discount_mechanisms")
@Getter
@Setter
public class OrderItemDiscountMechanismEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItemEntity orderItem;

    @Column(name = "discount_mechanism_id", nullable = false)
    private Long discountMechanismId;

    @Enumerated(EnumType.STRING)
    @Column(name = "mechanism_type", nullable = false)
    private MechanismType mechanismType;

    @Enumerated(EnumType.STRING)
    @Column(name = "discount_type", nullable = false)
    private DiscountType discountType;

    @Column(name = "discount_amount", nullable = false)
    private BigDecimal discountAmount;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(name = "description")
    private String description;
}
