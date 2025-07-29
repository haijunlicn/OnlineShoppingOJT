package com.maven.OnlineShoppingSB.audit;

import java.util.Map;

public interface AuditableDto {
    Map<String, Object> toAuditMap();
    // Optional method to get previous state for updates
    default Map<String, Object> toOldAuditMap() {
        return Map.of(); // empty by default
    }
}
