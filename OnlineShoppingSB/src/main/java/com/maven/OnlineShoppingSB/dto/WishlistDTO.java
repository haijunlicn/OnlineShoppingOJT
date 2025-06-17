package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class WishlistDTO {
    private Long productId;
    private Long wishlistTitleId;
    private String productName;
    private ProductDTO product;
}
