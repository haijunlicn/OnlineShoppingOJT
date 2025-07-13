package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.audit.AuditableDto;
import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class BulkOrderStatusUpdateRequest implements AuditableDto {
    private List<Long> orderIds;
    private String statusCode;
    private String note;
    private Long updatedBy;

    @Override
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("orderIds", orderIds);
        map.put("statusCode", statusCode);
        map.put("note", note);
        map.put("updatedBy", updatedBy);
        return map;
    }
}
