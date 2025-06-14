package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProductListItemDTO {
<<<<<<< Updated upstream
    private long id;
=======
>>>>>>> Stashed changes
    private ProductDTO product;
    private BrandDTO brand;
    private CategoryDTO category;
    private List<ProductVariantDTO> variants;
    private List<ProductOptionDTO> options;
<<<<<<< Updated upstream
    private List<ProductImageDTO> images;
=======
>>>>>>> Stashed changes
}


