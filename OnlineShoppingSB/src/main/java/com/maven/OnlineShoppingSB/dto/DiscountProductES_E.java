package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DiscountProductES_E {
    private Integer id;
    private Integer discountMechanismId;
    private Long productId;
    private  DiscountMechanismES_B discountMechanism;
    private  ProductDTO product;
}
