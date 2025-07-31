package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.DiscountType;
import com.maven.OnlineShoppingSB.entity.MechanismType;
import com.maven.OnlineShoppingSB.entity.typeCA;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class DiscountUsageDTO {
    private Integer mechanismId;
    private Long userId;
    private Integer usageCount;
    private LocalDateTime lastUsedAt;

    public static enum DiscountUsageStatus {
        AVAILABLE,
        INVALID,
        EXCEEDED_TOTAL_LIMIT,
        EXCEEDED_PER_USER_LIMIT
    }

}
