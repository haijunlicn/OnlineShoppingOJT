package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class ProductQuestionDto {
    private Long id;
    private Long productId;
    private Long userId;
    private String userName;
    private String questionText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String productName; 
    private List<ProductAnswerDto> answers;
}