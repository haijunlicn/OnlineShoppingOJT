package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.util.List;

@Data
public class VariantOptionDTO {

	private Long optionId;
	private Long optionValueId;
	private String optionName;   // Optional, e.g., "Material"
	private String valueName;

}


