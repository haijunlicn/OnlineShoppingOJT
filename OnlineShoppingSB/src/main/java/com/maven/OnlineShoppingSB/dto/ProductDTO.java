package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProductDTO {
    private Long id;
    private String name;
    private String description;
    private Long brandId;
    private Long categoryId;
    private BigDecimal basePrice;
    private List<ProductImageDTO> productImages;
    private LocalDateTime createdDate;
    private BrandDTO brand;
    private CategoryDTO category;
    private  List<ProductVariantDTO> productVariants;
}
