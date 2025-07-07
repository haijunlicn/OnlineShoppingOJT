package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.RefundItemStatus;
import com.maven.OnlineShoppingSB.entity.RequestedRefundAction;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class RefundRequestDTO {
    private Long userId;
    private Long orderId;
    private List<RefundItemDTO> items;

    // getters and setters

    @Data
    public static class RefundItemDTO {
        private Long orderItemId;
        private int quantity;
        private String reasonId;       // or Long if reasonId is numeric
        private String customReasonText;
        private List<String> proofImageUrls;
        private RequestedRefundAction requestedAction;
        // getters and setters
    }

    @Data
    public static class ApproveRejectRequestDTO {
        private String comment;
        private boolean generateTrackingCode = false; // only for approve refund request
    }

    @Data
    public static class RejectRequestDTO {
        private Long reasonId;
        private String comment;
    }

    @Data
    public static class RefundedRequestDTO {
        private Double refundAmount;
        private String comment;
    }

    @Data
    public static class ReviewBatchRequestDTO {
        private Long refundRequestId;
        private Long adminId;
        private List<ReviewItemDecisionDTO> itemDecisions;
    }

    @Data
    public static class ReviewItemDecisionDTO {
        private Long itemId;
        private String action; // "approve" or "reject"
        private Long rejectionReasonId;
        private String comment;
    }

    @Data
    public static class StatusUpdateRequest {
        private Long itemId;
        private RefundItemStatus newStatus;
        private String note;
        private Long rejectionReasonId;
        private String rejectionComment;
        private Long adminId;
    }

}