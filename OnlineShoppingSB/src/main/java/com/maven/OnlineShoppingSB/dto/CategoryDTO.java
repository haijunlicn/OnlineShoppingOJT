package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Data
public class CategoryDTO {

    private Long id;

    @NotEmpty(message = "Name is required")
    private String name;
    private Long parentCategoryId;
    private String parentCategoryName;
    private String imgPath;

    private Integer delFg;
    private String createdDate;
    private String updatedDate;

    private List<OptionDTO> optionTypes;
}
