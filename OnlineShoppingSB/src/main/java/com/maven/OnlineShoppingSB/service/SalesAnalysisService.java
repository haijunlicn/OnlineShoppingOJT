package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.SalesChartDetailDto;
import com.maven.OnlineShoppingSB.dto.SalesChartPointDto;
import com.maven.OnlineShoppingSB.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import lombok.Getter;
import lombok.Setter;

@Service
public class SalesAnalysisService {
    @Autowired
    private OrderRepository orderRepository;

    public List<Map<String, Object>> getSalesChartData(
        String groupBy, LocalDateTime start, LocalDateTime end, String dateFormat
    ) {
        List<Object[]> rawResults;
        switch (groupBy) {
            case "Product":
                rawResults = orderRepository.getSalesByProductAndDate(start, end, dateFormat);
                break;
            case "ProductVariant":
                rawResults = orderRepository.getSalesByVariantAndDate(start, end, dateFormat);
                break;
            case "City":
                rawResults = orderRepository.getSalesByCityAndDate(start, end, dateFormat);
                break;
            case "Category":
            default:
                rawResults = orderRepository.getSalesByCategoryAndDate(start, end, dateFormat);
        }
        List<SalesChartPointDto> points = rawResults.stream()
            .map(row -> new SalesChartPointDto(
                row[0] != null ? row[0].toString() : "Unknown",
                row[1] != null ? row[1].toString() : "",
                row[2] != null ? ((Number) row[2]).doubleValue() : 0.0
            ))
            .collect(Collectors.toList());

        Map<String, List<SalesChartPointDto>> grouped = points.stream()
            .collect(Collectors.groupingBy(SalesChartPointDto::getGroupName));

        List<Map<String, Object>> chartData = new ArrayList<>();
        for (Map.Entry<String, List<SalesChartPointDto>> entry : grouped.entrySet()) {
            List<Map<String, Object>> series = entry.getValue().stream()
                .map(p -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("name", p.getTimePoint());
                    point.put("value", p.getValue());
                    return point;
                })
                .collect(Collectors.toList());
            Map<String, Object> group = new HashMap<>();
            group.put("name", entry.getKey());
            group.put("series", series);
            chartData.add(group);
        }
        return chartData;
    }

    public List<SalesChartDetailDto> getSalesChartDetailDataWithGroupBy(LocalDateTime start, LocalDateTime end, String dateFormat, String groupBy, String metric) {
        List<Object[]> rawResults;
        boolean isOrderCount = "Total Orders".equals(metric);
        
        switch (groupBy) {
            case "ProductVariant":
                if (isOrderCount) {
                    rawResults = orderRepository.getOrderCountByVariantAndDate(start, end, dateFormat);
                    // Map: category, product, variant, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            row[1] != null ? row[1].toString() : "Unknown", // product
                            row[2] != null ? row[2].toString() : "Unknown", // variant
                            "", // city
                            row[3] != null ? row[3].toString() : "", // timePoint
                            row[4] != null ? ((Number) row[4]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                } else {
                    rawResults = orderRepository.getSalesByVariantAndDate(start, end, dateFormat);
                    // Map: category, product, variant, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            row[1] != null ? row[1].toString() : "Unknown", // product
                            row[2] != null ? row[2].toString() : "Unknown", // variant
                            "", // city
                            row[3] != null ? row[3].toString() : "", // timePoint
                            row[4] != null ? ((Number) row[4]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                }
            case "Product":
                if (isOrderCount) {
                    rawResults = orderRepository.getOrderCountByProductAndDate(start, end, dateFormat);
                    // Map: category, product, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            row[1] != null ? row[1].toString() : "Unknown", // product
                            "", // variant
                            "", // city
                            row[2] != null ? row[2].toString() : "", // timePoint
                            row[3] != null ? ((Number) row[3]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                } else {
                    rawResults = orderRepository.getSalesByProductAndDate(start, end, dateFormat);
                    // Map: category, product, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            row[1] != null ? row[1].toString() : "Unknown", // product
                            "", // variant
                            "", // city
                            row[2] != null ? row[2].toString() : "", // timePoint
                            row[3] != null ? ((Number) row[3]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                }
            case "City":
                if (isOrderCount) {
                    rawResults = orderRepository.getOrderCountByCityAndDate(start, end, dateFormat);
                    // Map: city, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            "", // category
                            "", // product
                            "", // variant
                            row[0] != null ? row[0].toString() : "Unknown", // city
                            row[1] != null ? row[1].toString() : "", // timePoint
                            row[2] != null ? ((Number) row[2]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                } else {
                    rawResults = orderRepository.getSalesByCityAndDate(start, end, dateFormat);
                    // Map: city, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            "", // category
                            "", // product
                            "", // variant
                            row[0] != null ? row[0].toString() : "Unknown", // city
                            row[1] != null ? row[1].toString() : "", // timePoint
                            row[2] != null ? ((Number) row[2]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                }
            case "Category":
            default:
                if (isOrderCount) {
                    rawResults = orderRepository.getOrderCountByCategoryAndDate(start, end, dateFormat);
                    // Map: category, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            "", // product
                            "", // variant
                            "", // city
                            row[1] != null ? row[1].toString() : "", // timePoint
                            row[2] != null ? ((Number) row[2]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                } else {
                    rawResults = orderRepository.getSalesByCategoryAndDate(start, end, dateFormat);
                    // Map: category, timePoint, value
                    return rawResults.stream()
                        .map(row -> new SalesChartDetailDto(
                            row[0] != null ? row[0].toString() : "Unknown", // category
                            "", // product
                            "", // variant
                            "", // city
                            row[1] != null ? row[1].toString() : "", // timePoint
                            row[2] != null ? ((Number) row[2]).doubleValue() : 0.0, // value
                            metric
                        ))
                        .collect(Collectors.toList());
                }
        }
    }
}
