package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class DiscountDisplayDTO {

    private Integer id;
    private String name;
    private String title;
    private typeCA type; // e.g. AUTO or COUPON
    private String couponcode; // nullable for AUTO type

    private BigDecimal value; // Parsed numeric discount value
    private DiscountType discountType; // PERCENTAGE or FIXED
    private BigDecimal maxDiscountAmount; // Capping limit for percentage discounts
    private MechanismType mechanismType;

    private List<DiscountConditionGroupDTO> conditionGroups;
    private String shortLabel;        // e.g. "50% Off"
    private String conditionSummary; // e.g. "Buy 3 or more items to unlock this discount"
    private boolean requireFrontendChecking;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private List<FreeGiftES_F> freeGifts;
    private List<Long> offeredProductIds;
    private Integer usageLimitTotal;
    private Integer usageLimitPerUser;
    private Integer mechanismId;

    @Getter
    @Setter
    public static class DiscountConditionGroupDTO {
        private boolean logicOperator; // true = AND, false = OR
        private List<DiscountConditionDTO> conditions;
    }

    @Getter
    @Setter
    @ToString
    public static class DiscountConditionDTO {
        private conditionType conditionType;
        private String conditionDetail;
        private Operator operator;
        private String value; // Raw JSON string
        private Boolean eligible;
        private List<?> relatedEntities;
    }

}
