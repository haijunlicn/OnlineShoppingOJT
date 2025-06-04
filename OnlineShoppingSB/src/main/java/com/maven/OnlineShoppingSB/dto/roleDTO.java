package com.maven.OnlineShoppingSB.dto;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class roleDTO {

    private Integer id;

    @NotBlank(message = "Role name is required")
    @Size(max = 100, message = "Role name must be at most 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private LocalDateTime createdDate;
}
