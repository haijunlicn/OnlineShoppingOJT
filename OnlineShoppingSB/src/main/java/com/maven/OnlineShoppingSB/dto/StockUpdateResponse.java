package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StockUpdateResponse {
    private boolean success;
    private String message;
    private Integer updatedStock;
}
