package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.conditionType;
import com.maven.OnlineShoppingSB.entity.Operator;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountConditionES_D {
    private Integer id;
    private conditionType conditionType;
    private String conditionDetail;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private Operator operator;
//    private String value;
    private String[] value;
//private List<String> value;
    private Integer discountConditionGroupId;
    private  DiscountConditionGroupES_C discountConditionGroup;
}
