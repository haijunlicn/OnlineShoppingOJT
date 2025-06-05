package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateProductRequestDTO {
	private ProductDTO product;
	private List<OptionDTO> options;
	private List<ProductVariantDTO> variants;
}

