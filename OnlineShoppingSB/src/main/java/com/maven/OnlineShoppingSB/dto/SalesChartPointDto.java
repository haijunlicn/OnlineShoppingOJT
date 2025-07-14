package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesChartPointDto {
    private String groupName; // e.g., category name
    private String timePoint; // e.g., "2024-07-10"
    private Double value;     // e.g., total revenue

    public SalesChartPointDto(String groupName, String timePoint, Double value) {
        this.groupName = groupName;
        this.timePoint = timePoint;
        this.value = value;
    }
}
