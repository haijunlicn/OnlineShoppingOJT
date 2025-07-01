package com.maven.OnlineShoppingSB.entity;

public enum RefundStatus {
    REQUESTED,
    APPROVED_PENDING_RETURN,
    RETURN_IN_TRANSIT,
    RETURN_RECEIVED,
    RETURN_VERIFIED,
    PARTIALLY_REFUNDED,
    REFUNDED,
    REJECTED
}
