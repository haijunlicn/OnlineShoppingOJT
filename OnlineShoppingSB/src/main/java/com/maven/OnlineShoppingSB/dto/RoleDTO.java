package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class RoleDTO {

    private Long id;

    @NotBlank(message = "Role name is required")
    @Size(max = 100, message = "Role name must be at most 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    private Integer type; 

    private Integer delFg; 
    private List<userDTO> users;

    private LocalDateTime createdDate;

    private List<PermissionDTO> permissions; 
}
