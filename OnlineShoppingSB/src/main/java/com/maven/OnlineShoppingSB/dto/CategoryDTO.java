package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryDTO {

    private Long id;

    @NotEmpty(message = "Name is required")
    private String name;
    private Long parentCategoryId;

    private String parentCategoryName;
    private Integer delFg;

    private String createdDate;
    private String updatedDate;
}
