package com.maven.OnlineShoppingSB.dto;


import com.maven.OnlineShoppingSB.audit.AuditableDto;

import java.util.HashMap;
import java.util.Map;

public class PaymentStatusUpdateAuditDto implements AuditableDto {
    private Long orderId;
    private String newStatus;
    private Long adminUserId;
    private Map<String, Object> rejectionDetails;

    public PaymentStatusUpdateAuditDto(Long orderId, String newStatus, Long adminUserId, Map<String, Object> rejectionDetails) {
        this.orderId = orderId;
        this.newStatus = newStatus;
        this.adminUserId = adminUserId;
        this.rejectionDetails = rejectionDetails;
    }

    public Long getOrderId() { return orderId; }
    public String getNewStatus() { return newStatus; }
    public Long getAdminUserId() { return adminUserId; }
    public Map<String, Object> getRejectionDetails() { return rejectionDetails; }

    @Override
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("orderId", orderId);
        map.put("newStatus", newStatus);
        map.put("adminUserId", adminUserId);
        map.put("rejectionDetails", rejectionDetails);
        return map;
    }
}