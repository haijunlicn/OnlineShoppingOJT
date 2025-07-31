package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.CategoryEntity;
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
    private Long productCount;

    private List<OptionDTO> optionTypes;

    public static CategoryDTO fromEntity(CategoryEntity entity) {
        if (entity == null) return null;

        CategoryDTO dto = new CategoryDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setImgPath(entity.getImgPath());
        return dto;
    }

}
