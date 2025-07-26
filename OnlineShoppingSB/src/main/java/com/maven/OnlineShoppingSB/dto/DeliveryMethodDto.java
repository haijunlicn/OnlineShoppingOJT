package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryMethodDto {
    private Integer id;
    private String name;
    private Double minDistance;
    private Double maxDistance;
    private Integer baseFee;
    private Integer feePerKm;
    private Integer feePerKmOutCity;
    private String icon;
    private Integer type; // 1 = default, 0 or null = normal
}