package com.maven.OnlineShoppingSB.dto;

import com.maven.OnlineShoppingSB.entity.NotiMethod;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class NotificationDTO {


    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestNotificationRequest {
        private String type; // e.g., "ORDER_STATUS"
        private String metadata; // e.g., JSON: {"orderId":123456}
        private List<Long> targetUserIds; // Optional list of user IDs (or null/empty for auto)
    }

    @Getter
    @Setter
    @AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }

    @Getter
    @Setter
    public static class TriggerNotificationRequest {
        private String type;
        private Map<String, Object> metadata;
        private List<Long> targetUserIds; // optional
    }

}
