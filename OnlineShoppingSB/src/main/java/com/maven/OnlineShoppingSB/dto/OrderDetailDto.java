package com.maven.OnlineShoppingSB.dto;

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
    private String paymentStatus;
    private Integer totalAmount;
    private Integer shippingFee;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String paymentProofPath;
    
    // Payment method information
    private PaymentDTO paymentMethod;
    private String paymentType;
    
    // User information
    private userDTO user;
    
    // Address information
    private UserAddressDto shippingAddress;
    
    // Delivery method
    private DeliveryMethodDto deliveryMethod;
    
    // Order items
    private List<OrderItemDetailDto> items;
    
    // Status history
    private List<OrderStatusHistoryDto> statusHistory;
} 