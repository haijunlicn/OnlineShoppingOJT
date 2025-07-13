package com.maven.OnlineShoppingSB.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class RefundReasonDTO {

	private Long id;
    private String label;
    private Integer delFg;
    private Boolean allowCustomText;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
