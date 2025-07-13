package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GroupES_G {
    private Integer id;
    private String name;
    private String createDate;
    private String updateDate;

    private List<CustomerGroupES_H> customerGroup;
    private List<DiscountConditionGroupES_C> discountConditionGroups;
}
