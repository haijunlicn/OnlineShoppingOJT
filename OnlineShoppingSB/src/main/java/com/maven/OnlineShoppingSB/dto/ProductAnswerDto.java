package com.maven.OnlineShoppingSB.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ProductAnswerDto {
    private Long id;
    private Long questionId;
    private Long adminId;
    private String adminName;
    private String answerText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}