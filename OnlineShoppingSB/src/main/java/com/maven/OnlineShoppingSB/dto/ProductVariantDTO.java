package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ProductVariantDTO {
	private long id;
	private List<VariantOptionDTO> options;
	private BigDecimal price;
	private Integer stock;
	private String sku;
	private List<VariantPriceDTO> priceHistory;
	private String imgPath;  // For display (optional)
}

