package com.maven.OnlineShoppingSB.audit;

import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class AuditEventDTO {
    private final String action;
    private final String entityType;
    private final Long entityId;
    private final Map<String, Object> changedData;
    private final Long userId;
    private final String userType;
    private final String ipAddress;
    private final String userAgent;

    public AuditEventDTO(String action, String entityType, Long entityId,
                         Map<String, Object> changedData, Long userId, String userType,
                         String ipAddress, String userAgent) {
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.changedData = changedData;
        this.userId = userId;
        this.userType = userType;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }
}
