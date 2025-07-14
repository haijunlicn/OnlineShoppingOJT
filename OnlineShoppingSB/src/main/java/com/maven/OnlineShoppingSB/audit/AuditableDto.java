package com.maven.OnlineShoppingSB.audit;

import java.util.Map;

public interface AuditableDto {
    Map<String, Object> toAuditMap();
}
