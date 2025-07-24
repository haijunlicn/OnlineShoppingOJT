package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.DiscountType;
import com.maven.OnlineShoppingSB.entity.MechanismType;
import com.maven.OnlineShoppingSB.entity.typeCA;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountEventDTO {
    private Integer id;
    private String name;
    private String description;
    private typeCA type;
    private String imgUrl;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private List<DiscountMechanismDTO> mechanisms;

    @Getter
    @Setter
    public static class DiscountMechanismDTO {
        private Integer id;
        private String couponCode;
        private BigDecimal value;
        private DiscountType discountType;
        private MechanismType mechanismType;
        private BigDecimal maxDiscountAmount;
        private Integer usageLimitTotal;
        private Integer usageLimitPerUser;
        private List<ProductDTO> offeredProducts;
        private List<DiscountDisplayDTO.DiscountConditionGroupDTO> conditionGroups;
    }
}
