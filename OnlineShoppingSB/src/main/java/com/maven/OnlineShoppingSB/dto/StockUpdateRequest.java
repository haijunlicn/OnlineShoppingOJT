package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.util.Set;

@Getter
@Setter
@ToString
public class StockUpdateRequest {
    private Long variantId;
    private Integer quantity;
}
