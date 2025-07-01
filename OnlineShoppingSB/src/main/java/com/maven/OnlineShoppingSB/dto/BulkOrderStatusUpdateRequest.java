package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkOrderStatusUpdateRequest {
    private List<Long> orderIds;
    private Integer statusId;
    private String note;
    private Long updatedBy;
}
