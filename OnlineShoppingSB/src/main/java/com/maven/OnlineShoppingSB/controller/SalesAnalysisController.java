package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.service.SalesAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.maven.OnlineShoppingSB.dto.SalesChartDetailDto;
import com.maven.OnlineShoppingSB.dto.ProductListItemDTO;
import com.maven.OnlineShoppingSB.dto.CategoryDTO;
import com.maven.OnlineShoppingSB.service.ProductService;
import com.maven.OnlineShoppingSB.service.CategoryService;

import java.util.HashMap;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/analytics")
public class SalesAnalysisController {
    @Autowired
    private SalesAnalysisService salesAnalysisService;
    @Autowired
    private ProductService productService;
    @Autowired
    private CategoryService categoryService;

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

    @GetMapping("/public/top-home")
    public Map<String, Object> getTopHomeData() {
        // Last month
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusMonths(1);
        String dateFormat = "%Y-%m";
        String metric = "Total Orders";

        // Top Categories by order count
        List<SalesChartDetailDto> categoryStats = salesAnalysisService.getSalesChartDetailDataWithGroupBy(
                start, end, dateFormat, "Category", metric);
        Map<String, Double> categoryOrderCounts = new HashMap<>();
        for (SalesChartDetailDto dto : categoryStats) {
            categoryOrderCounts.merge(dto.getCategory(), dto.getValue(), Double::sum);
        }
        List<String> topCategoryNames = categoryOrderCounts.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        List<CategoryDTO> allCategories = categoryService.getAllCategories();
        List<CategoryDTO> topCategories = allCategories.stream()
                .filter(cat -> topCategoryNames.contains(cat.getName()))
                .collect(Collectors.toList());

        // Top Products by order count
        List<SalesChartDetailDto> productStats = salesAnalysisService.getSalesChartDetailDataWithGroupBy(
                start, end, dateFormat, "Product", metric);
        Map<String, Double> productOrderCounts = new HashMap<>();
        for (SalesChartDetailDto dto : productStats) {
            productOrderCounts.merge(dto.getProduct(), dto.getValue(), Double::sum);
        }
        List<String> topProductNames = productOrderCounts.entrySet().stream()
                .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        List<ProductListItemDTO> allProducts = productService.getAllProducts();
        List<ProductListItemDTO> topProducts = allProducts.stream()
                .filter(prod -> topProductNames.contains(prod.getProduct().getName()))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("topCategories", topCategories);
        result.put("topProducts", topProducts);
        return result;
    }
}
