package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.BrandEntity;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class BrandDTO {

    private Long id;
    @NotEmpty(message = "Name is required")
    private String name;
    private String logo;
    private String baseSku;
    private Integer delFg;
    private String createdDate;
    private String updatedDate;

    public BrandDTO() {
    }

    public BrandDTO(Long id, String name) {
        this.id = id;
        this.name = name;
    }

    public static BrandDTO fromEntity(BrandEntity entity) {
        if (entity == null) return null;
        BrandDTO dto = new BrandDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setBaseSku(entity.getBaseSku());
        return dto;
    }

}
