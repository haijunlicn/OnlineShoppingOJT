package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductListItemDTO {
    private ProductDTO product;
    private BrandDTO brand;
    private CategoryDTO category;
    private List<ProductVariantDTO> variants;
    private List<ProductOptionDTO> options;
}


