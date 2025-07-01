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
    private String note;
    private LocalDateTime createdAt;
    private Long updatedBy;
}
