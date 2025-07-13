package com.maven.OnlineShoppingSB.entity;

public enum RequestedRefundAction {
    REFUND_ONLY,       // No return, just get money back
    RETURN_AND_REFUND, // Return item, then get refund
    REPLACEMENT        // Return item, get a new one
}

