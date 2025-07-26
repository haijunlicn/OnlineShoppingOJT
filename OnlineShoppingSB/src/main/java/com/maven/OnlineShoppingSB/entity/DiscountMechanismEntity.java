package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "discountMechanism")
public class DiscountMechanismEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private MechanismType mechanismType;


    @Column(nullable = true)
    private Integer quantity;

    @Column(name = "couponcode", nullable = true)
    private String couponcode;

    private String serviceDiscount;
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;

    private String value;
    private String maxDiscountAmount;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @Column(nullable = true)
    private Integer usageLimitTotal;

    @Column(nullable = true)
    private Integer usageLimitPerUser;


    @ManyToOne
    @JoinColumn(name = "discounts_id")
    private DiscountEntity discount;

    @OneToMany(mappedBy = "discountMechanism", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<DiscountConditionGroupEntity> discountConditionGroup;

    @OneToMany(mappedBy = "mechanism", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<FreeGiftEntity> freeGifts;

    @OneToMany(mappedBy = "discountMechanism", cascade = CascadeType.ALL,orphanRemoval = true)
    private List<DiscountProductEntity> discountProducts;
}
