package com.maven.OnlineShoppingSB.entity;

public enum RefundItemStatus {
    REQUESTED,           // Customer requested refund for this item
    APPROVED,            // Admin approved the request (initial)
    RETURN_PENDING,      // Waiting for customer to return the item
    RETURN_RECEIVED,     // Admin received the returned item
    RETURN_REJECTED,     // Returned item failed inspection
    REFUNDED,            // Item was refunded (money returned)
    REPLACED,            // Replacement item sent
    REJECTED             // Admin rejected the refund request directly
}
