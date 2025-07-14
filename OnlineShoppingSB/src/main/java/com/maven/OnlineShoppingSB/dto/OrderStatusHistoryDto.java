package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
public class OrderStatusHistoryDto {
    private Long id;
    private Long orderId;
    private Integer statusId;
    private String statusCode;
    private String note;
    private LocalDateTime createdAt;
    private Long updatedBy;
    private OrderStatusDto status;

    @Getter
    @Setter
    public static class OrderStatusDto {
        private Integer id;
        private String code;
        private Integer displayOrder;
        private Boolean isFailure;
        private Boolean isFinal;
        private String label;
    }

}
