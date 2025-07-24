package com.maven.OnlineShoppingSB.dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class userDTO {
    private Long id;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;
    private String phone;
    private Boolean isVerified;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String roleName;
    private List<String> permissions;
    private LocalDateTime lastLoginDate;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotNull(message = "Role ID is required")
    private Long roleId;

    private List<Long> groupIds;
    // Add city for user address
    private String city;
}
