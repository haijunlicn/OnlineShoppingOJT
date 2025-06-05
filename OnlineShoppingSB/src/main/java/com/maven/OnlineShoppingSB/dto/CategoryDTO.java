package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryDTO {

<<<<<<< Updated upstream
    private Long id;
=======
    private Integer id;
>>>>>>> Stashed changes

    @NotEmpty(message = "Name is required")
    private String name;

<<<<<<< Updated upstream
    private Long parentCategoryId;
=======
    private Integer parentCategoryId;
>>>>>>> Stashed changes
    private String parentCategoryName;
    private Integer delFg;

    private String createdDate;
    private String updatedDate;
}
