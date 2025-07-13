package com.maven.OnlineShoppingSB.entity;

public enum RefundStatus {
    REQUESTED,             // Initial state, customer just submitted
    IN_PROGRESS,           // Admin approved some or all, process ongoing
    COMPLETED,             // All items processed (refunded, replaced, or rejected)
    REJECTED               // All items rejected (optional — or can be merged into COMPLETED)
}
