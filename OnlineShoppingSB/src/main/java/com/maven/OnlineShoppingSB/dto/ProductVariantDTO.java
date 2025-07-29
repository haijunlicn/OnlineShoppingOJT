package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.ProductVariantEntity;
import com.maven.OnlineShoppingSB.entity.VariantPriceEntity;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
public class ProductVariantDTO {
    private Long id;
    private List<VariantOptionDTO> options;
    private BigDecimal price;
    private Integer stock;
    private String sku;
    private List<VariantPriceDTO> priceHistory;
    private String imgPath;  // For display (optional)
    private userDTO createdBy;
    private LocalDateTime createdDate;
    private Integer delFg;

    public static ProductVariantDTO fromEntity(ProductVariantEntity entity) {
        if (entity == null) return null;

        ProductVariantDTO dto = new ProductVariantDTO();
        dto.setId(entity.getId());
        dto.setStock(entity.getStock());
        dto.setSku(entity.getSku());
        dto.setImgPath(entity.getImgPath());

        // --- Set active price ---
        LocalDateTime now = LocalDateTime.now();
        if (entity.getPrices() != null && !entity.getPrices().isEmpty()) {
            dto.setPriceHistory(entity.getPrices().stream()
                    .map(VariantPriceDTO::fromEntity)
                    .collect(Collectors.toList()));

            // Get the active price
            entity.getPrices().stream()
                    .filter(p -> (p.getStartDate() == null || !p.getStartDate().isAfter(now)) &&
                            (p.getEndDate() == null || p.getEndDate().isAfter(now)))
                    .findFirst()
                    .ifPresent(activePrice -> dto.setPrice(activePrice.getPrice()));
        }

        return dto;
    }

    public record VariantOptionDisplay(
            String optionName,
            String valueName
    ) {}

    public record ProductVariantChange(
            Long id,
            String action, // "ADDED", "UPDATED", "REMOVED"
            String sku,
            int stock,
            String imgPath,
            BigDecimal price,
            List<VariantOptionDisplay> options,
            Map<String, Object> oldSnapshot // add this
    ) {}

    public record ProductVariantUpdateLogResult(
            List<ProductVariantChange> added,
            List<ProductVariantChange> removed,
            List<ProductVariantChange> updated
    ) {}

}

