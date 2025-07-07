package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RejectionReasonDTO {
    private Long id;
    private String label;
    private Integer delFg;
    private Boolean allowCustomText;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
