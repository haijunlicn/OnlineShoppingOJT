package com.maven.OnlineShoppingSB.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.apache.commons.text.StringSubstitutor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
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
    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private NotificationTypeRepository notiTypeRepository;



    public NotificationEntity createNotificationAndDeliver(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
        System.out.println("MayNoti============================================="+targetUserIds);
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

    public void createCustomNotification(NotificationDTO dto) {
        System.out.println("Starting custom notification creation...");

        System.out.println("Received notification DTO: title='" + dto.getTitle() + "', message='" + dto.getMessage() +
                "', imageUrl='" + dto.getImageUrl() + "', scheduledAt='" + dto.getScheduledAt() + "', metadata=" + dto.getMetadata());

        NotificationTypeEntity customType = notificationTypeRepository.findByName("CUSTOM")
                .orElseThrow(() -> new RuntimeException("Custom notification type not found"));

        NotificationEntity notification = new NotificationEntity();
        notification.setType(customType);
        notification.setTitle(dto.getTitle());
        notification.setMessage(dto.getMessage());
        notification.setImageUrl(dto.getImageUrl());
        notification.setMetadata(dto.getMetadata());
        notification.setScheduledAt(dto.getScheduledAt());
        notification.setDelivered(false);
        notification.setCreatedAt(LocalDateTime.now());

        notificationRepository.save(notification);
        System.out.println("Saved NotificationEntity with ID: " + notification.getId());

        List<Long> userIds = dto.getTargetUserIdsFromMetadata();
        System.out.println("Parsed user IDs from metadata: " + userIds);

        if (userIds == null || userIds.isEmpty()) {
            System.out.println("No user IDs found in metadata. Skipping user notification.");
            return;
        }

        List<UserEntity> usersToNotify = userRepository.findAllById(userIds);
        System.out.println("Resolved users to notify: " + usersToNotify.size() + " users found");

        boolean isScheduledInFuture = dto.getScheduledAt() != null && dto.getScheduledAt().isAfter(LocalDateTime.now());

        for (UserEntity user : usersToNotify) {
            NotiMethod method = NotiMethod.IN_APP;

            boolean exists = userNotificationRepository
                    .existsByUserIdAndNotificationIdAndMethod(user.getId(), notification.getId(), method);
            if (exists) continue;

            UserNotificationEntity userNotification = new UserNotificationEntity();
            userNotification.setUser(user);
            userNotification.setNotification(notification);
            userNotification.setRead(false);
            userNotification.setMethod(method);

            if (!isScheduledInFuture) {

                System.out.println("it's not scheduled!");

                userNotification.setDeliveredAt(LocalDateTime.now());
                userNotificationRepository.save(userNotification);

                // WebSocket push
                messagingTemplate.convertAndSendToUser(
                        user.getEmail(),
                        "/queue/notifications",
                        toDto(userNotification)
                );
            } else {
                System.out.println("it's scheduled!");
                userNotificationRepository.save(userNotification);
            }
        }

        System.out.println("Custom notification processing completed.");
    }

    @Scheduled(fixedRate = 60_000) // Every 1 minute
    @Transactional
    public void deliverScheduledNotifications() {
        List<UserNotificationEntity> pending = userNotificationRepository
                .findUndeliveredScheduledNotifications(LocalDateTime.now());

        System.out.println("schedule is working");

        for (UserNotificationEntity userNotification : pending) {
            userNotification.setDeliveredAt(LocalDateTime.now());
            userNotificationRepository.save(userNotification);

            messagingTemplate.convertAndSendToUser(
                    userNotification.getUser().getEmail(),
                    "/queue/notifications",
                    toDto(userNotification)
            );
        }
    }


    private UserNotificationDTO toDto(UserNotificationEntity entity) {
        NotificationEntity notification = entity.getNotification();
        NotificationTypeEntity type = notification.getType();
        Map<String, Object> metadata = jsonService.fromJson(notification.getMetadata());

        UserNotificationDTO dto = new UserNotificationDTO();
        dto.setId(entity.getId());
        dto.setRead(entity.isRead());
        dto.setDeliveredAt(entity.getDeliveredAt());
        dto.setReadAt(entity.getReadAt());
        dto.setMethod(entity.getMethod());
        dto.setMetadata(notification.getMetadata());
        dto.setImageUrl(notification.getImageUrl());
        dto.setShowToast(type.isShowToast());

        // 👇 Logic: use custom content if present, else fallback to template rendering
        if (notification.getTitle() != null || notification.getMessage() != null) {
            dto.setTitle(notification.getTitle());
            dto.setMessage(notification.getMessage());
        } else {
            dto.setTitle(type.getTitleTemplate());  // raw template, no rendering here
            dto.setMessage(type.getMessageTemplate()); // raw template
        }

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

    public void notifyOrderPending(Long userId, Long orderId, BigDecimal totalAmount) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "totalAmount", totalAmount,
                "orderIdLink", "/customer/orderDetail/" + orderId
        );
        sendNamedNotification("ORDER_PENDING", metadata, List.of(userId));
    }

    public void notifyOrderStatusUpdate(Long userId, Long orderId, String statusCode) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "orderIdLink", "/customer/orderDetail/" + orderId
        );
        sendNamedNotification(statusCode, metadata, List.of(userId));
    }


//    public void notifyOrderPlaced(Long orderId, BigDecimal totalAmount) {
//        Map<String, Object> metadata = Map.of(
//                "orderId", orderId,
//                "totalAmount", totalAmount,
//                "orderIdLink", "/customer/orderDetail/" + orderId
//        );
//        List<Long> adminIds = getAdminIdsWithPermission("ORDER_READ");
//        sendNamedNotification("ORDER_PLACED", metadata, adminIds);
//    }

    public void notifyRefundRequested(Long orderId, Long customerId, String customerName) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "customerId", customerId,
                "customerName", customerName,
                "orderIdLink", "/customer/orderDetail/" + orderId,
                "customerIdLink", "/admin/customers/" + customerId
        );
        List<Long> adminIds = getAdminIdsWithPermission("ORDER_REFUND");
        sendNamedNotification("REFUND_REQUESTED", metadata, adminIds);
    }

    public void checkAndNotifyLowStock(ProductVariantEntity variant) {
        final int LOW_STOCK_THRESHOLD = 5;

        if (variant.getStock() <= LOW_STOCK_THRESHOLD & variant.getStock() != 0) {
            // Optionally check for recent notifications to avoid duplicates (implement if needed)

            Map<String, Object> metadata = Map.of(
                    "productId", variant.getProduct().getId(),
                    "productName", variant.getProduct().getName(),
                    "variantName", variant.getSku(),
                    "stock", variant.getStock(),
                    "productNameLink", "/admin/product/" + variant.getProduct().getId()
            );

            List<Long> adminIds = getAdminIdsWithPermission("PRODUCT_STOCK_UPDATE");
            sendNamedNotification("LOW_STOCK_ALERT", metadata, adminIds);
        }
    }

    public void checkAndNotifyOutOfStock(ProductVariantEntity variant) {
        if (variant.getStock() <= 0) {  // Out of stock condition

            Map<String, Object> metadata = Map.of(
                    "productId", variant.getProduct().getId(),
                    "productName", variant.getProduct().getName(),
                    "variantName", variant.getSku(),
                    "productNameLink", "/admin/product/" + variant.getProduct().getId()
            );

            List<Long> adminIds = getAdminIdsWithPermission("PRODUCT_STOCK_UPDATE");
            sendNamedNotification("OUT_OF_STOCK_ALERT", metadata, adminIds);
        }
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
    public List<NotificationDTO> getNotificationsByTypeName(String typeName) {
        List<NotificationEntity> entities = notificationRepository.findByType_Name(typeName);
        return entities.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private NotificationDTO convertToDTO(NotificationEntity entity) {
        NotificationDTO dto = new NotificationDTO();
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setImageUrl(entity.getImageUrl());
        dto.setMetadata(entity.getMetadata());
        dto.setScheduledAt(entity.getScheduledAt());
        return dto;
    }

    public void notifyWishlistUsersOnStockUpdate(Long productId) {
        // 1. Find all wishlists that contain this product (efficient query)
        List<WishlistEntity> wishlists = wishlistRepository.findAll()
                .stream()
                .filter(w -> w.getProduct() != null && w.getProduct().getId().equals(productId))
                .collect(Collectors.toList());

        // 2. Collect all unique userIds from wishlistTitle
      List<Long> userIds = wishlists.stream()
    .map(w -> {
        WishlistTitleEntity title = w.getWishlistTitle();
        return (title != null && title.getUser() != null) ? title.getUser().getId() : null;
    })
    .filter(Objects::nonNull)
    .collect(Collectors.toList()); // ← ဒီလိုပြောင်းပါ

        if (userIds.isEmpty()) return;

        // 3. Prepare notification metadata (add more info if needed)
        Map<String, Object> metadata = Map.of(
                "productId", productId,
                    "productNameLink","customer/product/"+productId
                // e.g. "productName", "variantName" can be added if needed
        );

        // 4. Use sendNamedNotification (already handles NotificationEntity, UserNotificationEntity, delivery)
        System.out.println("HIHIHIHIHHHHHHHHHHHHHHHHHH______________________________________________"+userIds);
        sendNamedNotification(
                "STOCK_UPDATE_FOR_WISHLISTEDUSER", // notification type name (must exist in DB)
                metadata,
                userIds
        );
    }
}
