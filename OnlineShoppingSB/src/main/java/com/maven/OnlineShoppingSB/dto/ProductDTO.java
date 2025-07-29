package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.audit.AuditableDto;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
public class ProductDTO implements AuditableDto {
    private Long id;
    private String name;
    private String description;
    private Long brandId;
    private Long categoryId;
    private BigDecimal basePrice;
    private List<ProductImageDTO> productImages;
    private LocalDateTime createdDate;
    private userDTO createdBy;
    private BrandDTO brand;
    private CategoryDTO category;
    private List<ProductVariantDTO> productVariants;
    private Integer delFg;

    // Overload with 1 param for Function<T, R> compatibility
    public static ProductDTO fromEntity(ProductEntity entity) {
        return fromEntity(entity, false, false);
    }

    public static ProductDTO fromEntity(ProductEntity entity, boolean includeVariants, boolean filterGiftEligible) {
        if (entity == null) return null;

        ProductDTO dto = new ProductDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setDescription(entity.getDescription());
        dto.setBasePrice(entity.getBasePrice());
        dto.setCreatedDate(entity.getCreatedDate());

        if (entity.getBrand() != null) {
            dto.setBrandId(entity.getBrand().getId());
            dto.setBrand(BrandDTO.fromEntity(entity.getBrand()));
        }

        if (entity.getCategory() != null) {
            dto.setCategoryId(entity.getCategory().getId());
            dto.setCategory(CategoryDTO.fromEntity(entity.getCategory()));
        }

        // Product images
        if (entity.getProductImages() != null) {
            dto.setProductImages(entity.getProductImages().stream()
                    .map(ProductImageDTO::fromEntity)
                    .toList());
        }

        // Optionally include variants
        if (includeVariants && entity.getVariants() != null) {
            List<ProductVariantDTO> variantDTOs = entity.getVariants().stream()
                    .filter(v -> !filterGiftEligible || (v.getStock() != null && v.getStock() > 0))
                    .map(ProductVariantDTO::fromEntity)
                    .toList();

            dto.setProductVariants(variantDTOs);
        }

        return dto;
    }

    // Hold old snapshot for audit comparison
    private ProductDTO oldSnapshot;

    @Override
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("description", description);
        map.put("brandId", brandId);

        map.put("categoryId", categoryId);

        map.put("basePrice", basePrice);
        return map;
    }

    @Override
    public Map<String, Object> toOldAuditMap() {
        if (oldSnapshot == null) return Map.of();

        Map<String, Object> map = new HashMap<>();
        map.put("id", oldSnapshot.getId());
        map.put("name", oldSnapshot.getName());
        map.put("description", oldSnapshot.getDescription());
        map.put("brandId", oldSnapshot.getBrandId());

        map.put("categoryId", oldSnapshot.getCategoryId());

        map.put("basePrice", oldSnapshot.getBasePrice());

        return map;
    }

    public void setOldSnapshot(ProductDTO oldSnapshot) {
        this.oldSnapshot = oldSnapshot;
    }

}
