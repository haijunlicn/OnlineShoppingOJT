package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FreeGiftES_F {
    private Integer id;
    private Integer mechanismId;
    private Long productId;
    private  DiscountMechanismES_B discountMechanism;
    private  ProductDTO product;
}
