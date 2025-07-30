package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.VariantPriceEntity;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VariantPriceDTO {
    private Long id;
    private BigDecimal price;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Long orderCount;

    public static VariantPriceDTO fromEntity(VariantPriceEntity entity) {
        if (entity == null) return null;

        VariantPriceDTO dto = new VariantPriceDTO();
        dto.setId(entity.getId());
        dto.setPrice(entity.getPrice());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());

        return dto;
    }

}
