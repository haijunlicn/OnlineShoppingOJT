package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.UserNotificationDTO;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserNotificationService {

    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private UserNotificationRepository userNotificationRepository;
    @Autowired
    private NotificationTypeRepository notificationTypeRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserNotificationPreferenceRepository userNotificationPreferenceRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private JsonService jsonService;

    public List<UserNotificationDTO> getInAppNotificationsForUser(Long userId) {
        return userNotificationRepository.findByUserIdAndMethodOrderByDeliveredAtDesc(userId, NotiMethod.IN_APP)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public UserNotificationDTO toDTO(UserNotificationEntity entity) {
        UserNotificationDTO dto = new UserNotificationDTO();
        dto.setId(entity.getId());
        dto.setRead(entity.isRead());
        dto.setDeliveredAt(entity.getDeliveredAt());
        dto.setReadAt(entity.getReadAt());
        dto.setMethod(entity.getMethod());
        dto.setImageUrl(entity.getNotification().getImageUrl());
        dto.setShowToast(entity.getNotification().getType().isShowToast());

        NotificationEntity notification = entity.getNotification();
        if (notification != null) {
            NotificationTypeEntity type = notification.getType();
            Map<String, Object> metadata = jsonService.fromJson(notification.getMetadata());

            // 👇 Logic: use custom content if present, else fallback to template rendering
            if (notification.getTitle() != null || notification.getMessage() != null) {
                dto.setTitle(notification.getTitle());
                dto.setMessage(notification.getMessage());
            } else {
                dto.setTitle(type.getTitleTemplate());  // raw template, no rendering here
                dto.setMessage(type.getMessageTemplate()); // raw template
            }

            dto.setMetadata(notification.getMetadata());
        }

        return dto;
    }

}
