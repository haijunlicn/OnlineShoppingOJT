package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StockUpdateRequestDTO {
    private Long productId;
    private List<StockChange> stockUpdates;

    @Data
    public static class StockChange {
        private Long variantId;
        private int newStock;
    }
}
