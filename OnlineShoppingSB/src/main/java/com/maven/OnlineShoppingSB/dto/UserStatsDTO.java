package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserStatsDTO {
    private Long userId;
    private Long orderCount;
    private Double totalSpent;
} 