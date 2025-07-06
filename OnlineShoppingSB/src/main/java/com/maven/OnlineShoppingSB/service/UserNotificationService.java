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

        if (entity.getNotification() != null) {
            dto.setTitle(entity.getNotification().getType().getTitleTemplate());
            dto.setMessage(entity.getNotification().getType().getMessageTemplate());
            dto.setMetadata(entity.getNotification().getMetadata()); // if exists
        }

        return dto;
    }

}
