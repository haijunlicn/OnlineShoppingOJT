package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class LoginRequest {

    private String email;
    private String password;
    private Boolean rememberMe;
    private String roleName;
    private Integer roleType;

}
