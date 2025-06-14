package com.maven.OnlineShoppingSB.dto;

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
}
