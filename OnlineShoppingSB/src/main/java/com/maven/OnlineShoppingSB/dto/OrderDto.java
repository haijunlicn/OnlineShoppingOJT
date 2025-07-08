package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.PaymentStatus;
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
    private PaymentStatus paymentStatus;
    private Integer totalAmount;
    private Integer shippingFee;
    private Boolean deleted;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String paymentProofUrl;
    private List<OrderItemRequestDTO> items;
    private List<OrderStatusHistoryDto> statusHistoryList;
    private DeliveryMethodDto deliveryMethod;
    private PaymentDTO paymentMethod;
    private Long paymentMethodId;
    private String paymentType;
}
