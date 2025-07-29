package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.RefundStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RefundStatusHistoryDTO {
    private Long id;
    private RefundStatus status;
    private String note;
    private LocalDateTime createdAt;
    private Long updatedBy;
    private String updatedAdmin;
    private String updatedAdminRole;
}
