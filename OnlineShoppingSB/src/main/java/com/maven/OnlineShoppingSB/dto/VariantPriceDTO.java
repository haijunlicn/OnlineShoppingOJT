package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VariantPriceDTO {
	private Long id;
	private BigDecimal price;
	private LocalDateTime startDate;
	private LocalDateTime endDate;
}
