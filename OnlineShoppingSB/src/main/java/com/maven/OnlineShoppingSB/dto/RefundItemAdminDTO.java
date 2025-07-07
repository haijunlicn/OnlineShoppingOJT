package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.RefundItemStatus;
import com.maven.OnlineShoppingSB.entity.RefundStatus;
import com.maven.OnlineShoppingSB.entity.RequestedRefundAction;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RefundItemAdminDTO {
    private Long id;
    private Long orderItemId;
    private int quantity;
    private Long reasonId;
    private String adminComment;
    private String customReasonText;
    private RefundItemStatus status;
    private Long rejectionReasonId;
    private LocalDateTime updatedAt;
    private List<RefundItemImageDTO> images;
    private String productName;
    private String sku;
    private String productImg;  // URL or image path
    private RequestedRefundAction requestedAction;
    private List<RefundItemStatusHistoryDTO> statusHistory;
}
