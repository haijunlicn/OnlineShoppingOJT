package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.audit.AuditLogEntity;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
public class AuditLogDTO {
    private String action;
    private String entityType;
    private Long entityId;
    private String changedData; // now a String
    private Long userId;
    private String userType;
    private String username; // leave this blank/null (optional display label)
    private LocalDateTime createdDate;
    private Object affectedEntity;
}
