package com.maven.OnlineShoppingSB.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.entity.NotiMethod;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Getter
@Setter
public class NotificationDTO {

    private String title;
    private String message;
    private String imageUrl;
    private String metadata;
    private LocalDateTime scheduledAt;
    private List<Long> targetUserIds;

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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationTypeMethodDTO {
        private Long notificationTypeId;
        private String notificationTypeName;
        private NotiMethod method;
        private Integer status;
    }

    public List<Long> getTargetUserIdsFromMetadata() {
        if (metadata == null) return Collections.emptyList();
        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> meta = mapper.readValue(metadata, new TypeReference<>() {
            });
            Object raw = meta.get("targetUserIds");
            if (raw instanceof List<?> list) {
                return list.stream()
                        .filter(Objects::nonNull)
                        .map(Object::toString)
                        .map(Long::parseLong)
                        .toList();
            }
        } catch (Exception ignored) {
        }
        return Collections.emptyList();
    }


}
