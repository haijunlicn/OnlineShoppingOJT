package com.maven.OnlineShoppingSB.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
<<<<<<< Updated upstream
import java.util.List;
=======
>>>>>>> Stashed changes

@Data
public class ProductDTO {
    private String name;
    private String description;
    private Long brandId;
    private Long categoryId;
    private BigDecimal basePrice;
<<<<<<< Updated upstream
    private List<ProductImageDTO> productImages;
=======
>>>>>>> Stashed changes
    private LocalDateTime createdDate;
}
