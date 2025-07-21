package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.GroupEntity;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GroupES_G {
    private Long id;
    private String name;
    private String createDate;
    private String updateDate;

    private List<CustomerGroupES_H> customerGroup;
    private List<DiscountConditionGroupES_C> discountConditionGroups;

    public static GroupES_G fromEntity(GroupEntity entity) {
        GroupES_G dto = new GroupES_G();
        dto.setId(entity.getId());
        dto.setName(entity.getName());

        if (entity.getCreateDate() != null) {
            dto.setCreateDate(entity.getCreateDate().toString());
        }
        if (entity.getUpdateDate() != null) {
            dto.setUpdateDate(entity.getUpdateDate().toString());
        }

        // Map nested lists if needed, example:
        // dto.setCustomerGroup( /* convert entity.getCustomerGroups() to List<CustomerGroupES_H> */ );
        // dto.setDiscountConditionGroups( /* similar conversion for discount conditions */ );

        return dto;
    }

}
