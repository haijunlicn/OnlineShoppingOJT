package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class OrderDto {
    private Long id;
    private Long userId;
    private Integer shippingAddressId;
    private String trackingNumber;
    private String paymentStatus;
    private Integer totalAmount;
    private Integer shippingFee;
    private Boolean deleted;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String paymentProofUrl;
    private List<OrderItemRequestDTO> items;
    private List<OrderStatusHistoryDto> statusHistoryList;
    private DeliveryMethodDto deliveryMethod;
//    private PaymentDTO paymentMethod;
}
