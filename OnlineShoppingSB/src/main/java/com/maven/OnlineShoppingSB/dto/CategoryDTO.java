package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryDTO {

    private Integer id;

    @NotEmpty(message = "Name is required")
    private String name;

    private Integer parentCategoryId;
    private String parentCategoryName;
    private Integer delFg;

    private String createdDate;
    private String updatedDate;
}
