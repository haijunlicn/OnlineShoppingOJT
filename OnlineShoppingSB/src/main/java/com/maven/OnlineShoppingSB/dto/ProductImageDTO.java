package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.ProductImageEntity;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Data
public class ProductImageDTO {
    private Long id;
    private Long productId;
    private String imgPath;
    private int displayOrder;
    private boolean mainImageStatus;
    private String altText;
    private LocalDateTime createdDate;


    public static ProductImageDTO fromEntity(ProductImageEntity entity) {
        if (entity == null) return null;

        ProductImageDTO dto = new ProductImageDTO();
        dto.setId(entity.getId());
        dto.setProductId(entity.getProduct() != null ? entity.getProduct().getId() : null);
        dto.setImgPath(entity.getImgPath()); // Adjust based on field name
        dto.setDisplayOrder(entity.getDisplayOrder());
        dto.setMainImageStatus(entity.isMainImageStatus());
        dto.setAltText(entity.getAltText());
        dto.setCreatedDate(entity.getCreatedDate());

        return dto;
    }

}
