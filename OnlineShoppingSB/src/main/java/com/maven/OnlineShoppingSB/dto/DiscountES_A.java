package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.typeCA;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountES_A {
    private Integer id;
    private String name;
    private typeCA type;
    private String description;
    private String code;
    private String currentRedemptionCount;
    private String imgUrl;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Boolean isActive;
//    private Integer usageLimit;
//    private Integer perUserLimit;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;


    // Added OneToMany child DTOs
    private List<DiscountMechanismES_B> discountMechanisms;

}
