package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryOptionDTO {
	
    private Long id;
    private Long categoryId;
    private Long optionId;
    private Integer delFg;
    private String categoryName;
    private String optionName; 


}
