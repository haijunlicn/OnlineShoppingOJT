package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.NotiMethod;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserNotificationDTO {
    private Long id;
    private String title;
    private String message;
    private String metadata;
    private boolean read;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private NotiMethod method;
}
