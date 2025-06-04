package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class otpDTO {

    private Integer id;

    @NotNull(message = "User ID is required")
    private Integer userId;

    @NotBlank(message = "OTP code is required")
    private String otpCode;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    @NotNull(message = "Usage status is required")
    private Boolean isUsed;

    private LocalDateTime expiryTime;
    private LocalDateTime createdDate;
}
