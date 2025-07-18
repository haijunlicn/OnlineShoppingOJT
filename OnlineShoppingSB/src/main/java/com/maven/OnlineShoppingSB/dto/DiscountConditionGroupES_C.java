package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class DiscountConditionGroupES_C {
    private Integer id;
    private Boolean logicOperator;

    private Integer discountMechanismId;
    private long groupId;
    private DiscountMechanismES_B discountMechanism;
    private GroupES_G group;
    private List<DiscountConditionES_D> discountCondition;
}
