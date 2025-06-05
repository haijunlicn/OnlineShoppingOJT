package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.util.List;

@Data
public class VariantOptionDTO {
//	private String type;     // Option name, e.g., "Color"
//	private String typeName; // Redundant, but may help debugging
//	private String value;    // Value name, e.g., "Red"

	private Long optionId;
	private Long optionValueId;
	private String optionName;   // Optional, e.g., "Material"
	private String valueName;

}


