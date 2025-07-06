package com.maven.OnlineShoppingSB.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Data
public class RefundItemImageDTO {
    private Long id;
    private String imgPath;
    private LocalDateTime uploadedAt;
}

