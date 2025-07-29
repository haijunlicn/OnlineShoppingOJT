package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.audit.AuditableDto;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class CreateProductRequestDTO implements AuditableDto {
    private ProductDTO product;
    private List<OptionDTO> options;
    private List<ProductVariantDTO> variants;
    private List<ProductImageDTO> productImages;

    @Override
    public Map<String, Object> toAuditMap() {
        return product != null ? product.toAuditMap() : Map.of();
    }

    @Override
    public Map<String, Object> toOldAuditMap() {
        return product != null ? product.toOldAuditMap() : Map.of();
    }
}
