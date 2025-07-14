package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.OrderType;
import com.maven.OnlineShoppingSB.entity.PaymentStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@ToString
public class OrderDetailDto {
    private Long id;
    private String trackingNumber;
    private PaymentStatus paymentStatus;
    private String currentOrderStatus;
    private Integer totalAmount;
    private Integer shippingFee;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String paymentProofPath;
    private PaymentDTO paymentMethod;
    private String paymentType;
    private userDTO user;
    private UserAddressDto shippingAddress;
    private DeliveryMethodDto deliveryMethod;
    private List<OrderItemDetailDto> items;
    private List<OrderStatusHistoryDto> statusHistory;
    private List<RefundRequestAdminDTO> refunds;
    private OrderType orderType;
} 