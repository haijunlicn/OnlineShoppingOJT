package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.RefundItemStatus;
import com.maven.OnlineShoppingSB.entity.RefundStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RefundItemStatusHistoryDTO {
    private Long id;
    private RefundItemStatus status;
    private String note;
    private LocalDateTime createdAt;
    private Long updatedBy;
}
