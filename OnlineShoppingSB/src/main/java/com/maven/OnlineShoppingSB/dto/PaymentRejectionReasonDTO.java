// com.maven.OnlineShoppingSB.dto.PaymentRejectionReasonDTO.java
package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentRejectionReasonDTO {
    private Long id;
    private String label;
    private Boolean allowCustomText;
    private Integer delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @Data
    public static class PaymentRejectionRequestDTO {
        private Long reasonId;
        private String customReason;
    }

    @Data
    public static class PaymentStatusUpdateRequest {
        private String status;
        private PaymentRejectionReasonDTO.PaymentRejectionRequestDTO rejectionRequest;
    }

}
