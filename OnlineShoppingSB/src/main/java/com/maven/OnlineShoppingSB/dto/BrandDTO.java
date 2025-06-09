package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandDTO {

    private Long id;

    @NotEmpty(message = "Name is required")
    private String name;

    private Integer delFg;
    private String createdDate;
    private String updatedDate;

    public BrandDTO() {}

    public BrandDTO(Long id, String name) {
        this.id = id;
        this.name = name;
    }

}
