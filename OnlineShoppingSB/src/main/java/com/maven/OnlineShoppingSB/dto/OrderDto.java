package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.audit.AuditableDto;
import com.maven.OnlineShoppingSB.entity.OrderType;
import com.maven.OnlineShoppingSB.entity.PaymentStatus;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
public class OrderDto implements AuditableDto {
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
    private OrderType orderType;

    @Override
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("userId", userId);
        map.put("shippingAddressId", shippingAddressId);
        map.put("totalAmount", totalAmount);
        map.put("shippingFee", shippingFee);
        map.put("paymentStatus", paymentStatus != null ? paymentStatus.name() : null);
        map.put("orderType", orderType != null ? orderType.name() : null);
        map.put("paymentMethodId", paymentMethodId);
        map.put("deliveryMethodId", deliveryMethod != null ? deliveryMethod.getId() : null);
        map.put("itemCount", items != null ? items.size() : 0);
        return map;
    }

}
