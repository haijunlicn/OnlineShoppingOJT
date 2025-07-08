package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

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

    public NotificationEntity createNotificationAndDeliver(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
        NotificationTypeEntity type = notificationTypeRepository.findByName(typeName)
                .orElseThrow(() -> new IllegalArgumentException("NotificationType not found: " + typeName));

        NotificationEntity notification = new NotificationEntity();
        notification.setType(type);
        notification.setMetadata(jsonService.toJson(metadata));
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);

        List<UserEntity> usersToNotify;

        if (targetUserIds != null && !targetUserIds.isEmpty()) {
            usersToNotify = userRepository.findAllById(targetUserIds);
        } else {
            if (type.isAdminOnly()) {
                usersToNotify = userRepository.findAllByRole_Type(1); // fallback to role_type check
            } else {
                usersToNotify = userRepository.findAllNonAdminUsersWithEnabledNotification(type.getId());
            }
        }

        for (UserEntity user : usersToNotify) {
            Optional<UserNotificationPreferenceEntity> prefOpt =
                    userNotificationPreferenceRepository.findByUserIdAndNotificationTypeId(user.getId(), type.getId());
            if (prefOpt.isPresent() && !prefOpt.get().isEnabled()) continue;

            for (NotificationTypeMethodEntity methodMapping : type.getSupportedMethods()) {
                NotiMethod method = methodMapping.getMethod();

                // ✅ Check if already exists
                boolean exists = userNotificationRepository
                        .existsByUserIdAndNotificationIdAndMethod(user.getId(), notification.getId(), method);

                if (exists) continue; // 🔒 skip duplicate

                // ✅ Otherwise, save
                UserNotificationEntity userNotification = new UserNotificationEntity();
                userNotification.setUser(user);
                userNotification.setNotification(notification);
                userNotification.setRead(false);
                userNotification.setDeliveredAt(LocalDateTime.now());
                userNotification.setMethod(method);
                userNotificationRepository.save(userNotification);

                switch (method) {
                    case IN_APP -> messagingTemplate.convertAndSendToUser(
                            user.getEmail(),
                            "/queue/notifications",
                            toDto(userNotification)
                    );
                    case EMAIL -> {
                        // TODO: send email
                    }
                    case SMS -> {
                        // TODO: send SMS
                    }
                    case PUSH -> {
                        // TODO: send push notification
                    }
                }
            }
        }

        return notification;
    }

    private UserNotificationDTO toDto(UserNotificationEntity entity) {
        NotificationTypeEntity type = entity.getNotification().getType();
        Map<String, Object> metadata = jsonService.fromJson(entity.getNotification().getMetadata());

        UserNotificationDTO dto = new UserNotificationDTO();
        dto.setId(entity.getId());
        dto.setTitle(jsonService.renderTemplate(type.getTitleTemplate(), metadata));
        dto.setMessage(jsonService.renderTemplate(type.getMessageTemplate(), metadata));
        dto.setMetadata(entity.getNotification().getMetadata());
        dto.setRead(entity.isRead());
        dto.setDeliveredAt(entity.getDeliveredAt());
        dto.setReadAt(entity.getReadAt());
        dto.setMethod(entity.getMethod());
        return dto;
    }

    public void markAsRead(Long userNotificationId, Long userId) {
        UserNotificationEntity un = userNotificationRepository.findById(userNotificationId)
                .orElseThrow(() -> new IllegalArgumentException("UserNotification not found"));
        if (!un.getUser().getId().equals(userId)) {
            throw new SecurityException("User cannot mark notification of other users");
        }
        un.setRead(true);
        un.setReadAt(LocalDateTime.now());
        userNotificationRepository.save(un);
    }

    public void markAllAsRead(Long userId) {
        List<UserNotificationEntity> notifications = userNotificationRepository.findAllByUserIdAndReadIsFalse(userId);

        for (UserNotificationEntity n : notifications) {
            n.setRead(true);
            n.setReadAt(LocalDateTime.now());

            // Optional: WebSocket notify client of the update
            if (n.getMethod() == NotiMethod.IN_APP) {
                messagingTemplate.convertAndSendToUser(
                        n.getUser().getEmail(),
                        "/queue/notifications/read",
                        Map.of("id", n.getId())
                );
            }
        }

        userNotificationRepository.saveAll(notifications);
    }


    public void sendNamedNotification(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
        createNotificationAndDeliver(typeName, metadata, targetUserIds);
    }

    // ----------- NOTIFICATION METHODS WITH CORRECT PERMISSION CHECKS -----------

    // ✅ Expose general-purpose trigger method
    public void notify(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
        sendNamedNotification(typeName, metadata, targetUserIds);
    }

    // ✅ Updated usage
    public void notifyOrderPlaced(Long orderId, BigDecimal totalAmount) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "totalAmount", totalAmount
        );
        List<Long> adminIds = getAdminIdsWithPermission("ORDER_READ");
        sendNamedNotification("ORDER_PLACED", metadata, adminIds);
    }

    public void notifyRefundRequested(Long orderId, String customerName) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "customerName", customerName
        );
        List<Long> adminIds = getAdminIdsWithPermission("ORDER_REFUND");
        sendNamedNotification("REFUND_REQUESTED", metadata, adminIds);
    }

    public void notifyLowStock(String productName) {
        Map<String, Object> metadata = Map.of("productName", productName);
        List<Long> adminIds = getAdminIdsWithPermission("PRODUCT_STOCK_UPDATE");
        sendNamedNotification("LOW_STOCK_ALERT", metadata, adminIds);
    }

    // ----------- Permission Checker -----------

    public List<Long> getAdminIdsWithPermission(String permissionCode) {
        return userRepository.findAll().stream()
                .filter(user -> {
                    RoleEntity role = user.getRole();
                    return role != null && role.getPermissions().stream().anyMatch(p ->
                            p.getCode().equalsIgnoreCase(permissionCode) ||
                                    p.getCode().equalsIgnoreCase("SUPERADMIN_PERMISSION")
                    );
                })
                .map(UserEntity::getId)
                .toList();
    }

}
