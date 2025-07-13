package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.RefundStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RefundRequestAdminDTO {
    private Long id;
    private Long userId;
    private Long orderId;
    private OrderDetailDto orderDetail;
    private RefundStatus status;
    private String returnTrackingCode;
    private String customerTrackingCode;
    private LocalDateTime receivedDate;
    private LocalDateTime refundedDate;
    private String adminComment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<RefundItemAdminDTO> items;
    private List<RefundStatusHistoryDTO> statusHistory;

}
