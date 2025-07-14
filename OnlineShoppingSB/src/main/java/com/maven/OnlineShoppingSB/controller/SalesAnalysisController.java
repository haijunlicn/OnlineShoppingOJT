package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.service.SalesAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.maven.OnlineShoppingSB.dto.SalesChartDetailDto;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/analytics")
public class SalesAnalysisController {
    @Autowired
    private SalesAnalysisService salesAnalysisService;

    @GetMapping("/sales-by-category")
    public List<Map<String, Object>> getSalesByCategory(
        @RequestParam String timePeriod,
        @RequestParam(required = false, defaultValue = "Category") String groupBy
    ) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start;
        String dateFormat;
        switch (timePeriod) {
            case "month":
                start = end.minusMonths(12); // Last 12 months
                dateFormat = "%Y-%m";
                break;
            case "year":
                start = end.minusYears(1); // Last 1 year
                dateFormat = "%Y";
                break;
            case "week":
            default:
                start = end.minusDays(7); // Last 7 days
                dateFormat = "%Y-%m-%d";
        }
        return salesAnalysisService.getSalesChartData(groupBy, start, end, dateFormat);
    }

    @GetMapping("/sales-by-category-product-variant")
    public List<SalesChartDetailDto> getSalesByCategoryProductVariant(
        @RequestParam String timePeriod,
        @RequestParam(required = false, defaultValue = "Category") String groupBy,
        @RequestParam(required = false) String metric
    ) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start;
        String dateFormat;
        switch (timePeriod) {
            case "month":
                start = end.minusMonths(12); // Last 12 months
                dateFormat = "%Y-%m";
                break;
            case "year":
                start = end.minusYears(1); // Last 1 year
                dateFormat = "%Y";
                break;
            case "week":
            default:
                start = end.minusDays(7); // Last 7 days
                dateFormat = "%Y-%m-%d";
        }
        // Only allow Category, Product, ProductVariant, City
        if (!groupBy.equals("Category") && !groupBy.equals("Product") && !groupBy.equals("ProductVariant") && !groupBy.equals("City")) {
            groupBy = "Category";
        }
        // metric default
        if (metric == null) metric = "Total Revenue";
        return salesAnalysisService.getSalesChartDetailDataWithGroupBy(start, end, dateFormat, groupBy, metric);
    }
}
