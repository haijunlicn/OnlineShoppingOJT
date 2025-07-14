package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SalesChartDetailDto {
    private String category;
    private String product;
    private String variant;
    private String city;
    private String timePoint;
    private Double value;
    private String metric; // "Total Revenue" or "Total Orders"

    public SalesChartDetailDto(String category, String product, String variant, String timePoint, Double value) {
        this.category = category;
        this.product = product;
        this.variant = variant;
        this.timePoint = timePoint;
        this.value = value;
    }

    public SalesChartDetailDto(String category, String product, String variant, String city, String timePoint, Double value, String metric) {
        this.category = category;
        this.product = product;
        this.variant = variant;
        this.city = city;
        this.timePoint = timePoint;
        this.value = value;
        this.metric = metric;
    }
}
