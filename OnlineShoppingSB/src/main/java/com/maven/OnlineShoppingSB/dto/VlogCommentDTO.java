package com.maven.OnlineShoppingSB.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VlogCommentDTO {
    private Long id;
    private String author;
    private String text;
    private String avatarInitial;
    private LocalDateTime commentDate;

    private Long vlogId;
    private Long vlogFileId;

    // Add userId to link user
    private Long userId;
    
}
