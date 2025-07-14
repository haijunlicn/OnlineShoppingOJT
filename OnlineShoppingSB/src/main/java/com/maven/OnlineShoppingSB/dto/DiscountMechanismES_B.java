package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.DiscountType;
import com.maven.OnlineShoppingSB.entity.typeCA;
import com.maven.OnlineShoppingSB.entity.MechanismType;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountMechanismES_B {
    private Integer id;
    private MechanismType mechanismType;
    private Integer quantity;

    private DiscountType discountType;
    private String value;
    private String maxDiscountAmount;
    private Boolean delFg;
    private String serviceDiscount;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    private Integer discountId;
    private DiscountES_A discount;
    private List<DiscountConditionGroupES_C> discountConditionGroup;
    private List<FreeGiftES_F> freeGifts;
    private List<DiscountProductES_E> discountProducts;
}
