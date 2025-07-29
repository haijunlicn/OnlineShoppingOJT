package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductListItemDTO {
    private long id;
    private ProductDTO product;
    private BrandDTO brand;
    private CategoryDTO category;
    private List<ProductVariantDTO> variants;
    private List<ProductVariantDTO> deletedVariants;
    private List<ProductOptionDTO> options;
    private List<ProductImageDTO> images;
}


