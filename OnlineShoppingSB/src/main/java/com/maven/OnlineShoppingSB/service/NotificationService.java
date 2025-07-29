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

@Autowired
private EmailService emailService;

    public NotificationEntity createNotificationAndDeliver(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
      
        NotificationTypeEntity type = notificationTypeRepository.findByName(typeName)
                .orElseThrow(() -> new IllegalArgumentException("NotificationType not found: " + typeName));
        System.out.println("HI_____________________________________________________________________________________________________");
  System.out.println("NotificationType: " + type.getId() + " | " + type.getName() + " | " + type.getTitleTemplate());
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

            for (NotificationTypeMethodEntity methodMapping : type.getActiveSupportedMethods()) {

                NotiMethod method = methodMapping.getMethod();

                System.out.println(type.getSupportedMethods());
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
                  System.out.println("✅ UserNotification saved: " + userNotification);

                switch (method) {
                    case IN_APP -> messagingTemplate.convertAndSendToUser(
                            user.getEmail(),
                            "/queue/notifications",
                            toDto(userNotification)
                    );
                    case EMAIL -> {
                          String to = user.getEmail();
                // Title & message template rendering with condition
                String originalTemplate = type.getTitleTemplate();
                String processedTemplate = originalTemplate;
                
                // 👉 Condition: Handle different template types
                if (originalTemplate != null) {
                    // For order notifications: Remove "Track your order {{trackingNum}}"
                    if (originalTemplate.contains("Track your order {{trackingNum}}")) {
                        processedTemplate = originalTemplate.replace("Track your order {{trackingNum}}", "");
                        // Remove extra spaces and punctuation
                        processedTemplate = processedTemplate.replaceAll("\\s+", " ").trim();
                        processedTemplate = processedTemplate.replaceAll("\\s*,\\s*$", ""); // Remove trailing comma
                    }
                    // For product notifications: Replace {{productName}} with actual product name
                    else if (originalTemplate.contains("{{productName}}") && metadata.containsKey("productName")) {
                        processedTemplate = originalTemplate.replace("{{productName}}", (String) metadata.get("productName"));
                    }
                    // For reason notifications: Replace {{reason}} with actual reason
                    else if (originalTemplate.contains("{{reason}}") && metadata.containsKey("reason")) {
                        processedTemplate = originalTemplate.replace("{{reason}}", (String) metadata.get("reason"));
                    }
                    // For stock notifications: Replace {{productName}}({{variantName}}) with actual values
                    else if (originalTemplate.contains("{{productName}}({{variantName}})") && 
                             metadata.containsKey("productName") && metadata.containsKey("variantName")) {
                        String productName = (String) metadata.get("productName");
                        String variantName = (String) metadata.get("variantName");
                        processedTemplate = originalTemplate.replace("{{productName}}({{variantName}})", 
                            productName + "(" + variantName + ")");
                    }
                }
                // Ensure the processed template ends with a full stop
                if (processedTemplate != null && !processedTemplate.isEmpty() && !processedTemplate.endsWith(".")) {
                    processedTemplate += ".";
                }
                
                String subject = processedTemplate != null ? jsonService.renderTemplate(processedTemplate, metadata) : "Notification";
                
                // 👉 Debug the template processing
                System.out.println("🔧 TEMPLATE PROCESSING:");
                System.out.println("Original: " + originalTemplate);
                System.out.println("Processed: " + processedTemplate);
                System.out.println("Final Subject: " + subject);
        
                // Professional HTML email template
                String htmlContent = """
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>%s</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                            .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                            .content { padding: 30px; }
                            .title { color: #2c3e50; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
                            .message { color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px; }
                            .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; }
                            .footer { background-color: #ecf0f1; padding: 20px; text-align: center; color: #7f8c8d; font-size: 14px; }
                            .tracking-info { background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }
                            .tracking-number { font-weight: bold; color: #2980b9; }
                            .tracking-link { color: #3498db; text-decoration: underline; font-weight: bold; }
                            .message a { color: #3498db; text-decoration: underline; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>Britium Gallery Online Shop</h1>
                            </div>
                            <div class="content">
                                <div class="title">%s</div>
                
                                <!-- Conditional Content Section -->
                                %s
    
                            </div>
                            <div class="footer">
                                <p>Thank you for shopping with us! 🎉</p>
                            </div>
                        </div>
                    </body>
                    </html>
                """.formatted(
                    subject, // title
                    subject, // title in content
                    
                    // Conditional content based on notification type
                    metadata.containsKey("reason") ? 
                        "" : // No content section for reason notifications
                        metadata.containsKey("trackingNum") ? 
                            "<div class='tracking-info'><strong>📦 Track your order:</strong><br>Tracking Number: <a href='http://localhost:4200/customer/orderDetail/" + metadata.get("orderId") + "' class='tracking-link'>" + metadata.get("trackingNum") + "</a></div>" : 
                        metadata.containsKey("variantName") ? 
                            "<div class='tracking-info'><strong>📦 Restock product:</strong><br>Product: <a href='http://localhost:4200/admin/product/" + metadata.get("productId") + "' class='tracking-link'>" + metadata.get("productName") + "(" + metadata.get("variantName") + ")</a></div>" : 
                            "<div class='tracking-info'><strong>📦 Your wishlisted product:</strong><br>Product: <a href='http://localhost:4200/customer/product/" + metadata.get("productId") + "' class='tracking-link'>" + metadata.get("productName") + "</a></div>"
                );

                boolean sent = emailService.sendNotificationEmail(to, subject, htmlContent);
                System.out.println("📧 EMAIL sent to " + to + ": " + sent);
                    }
                    case SMS -> {
                        // TODO: send SMS
                    }
                    case PUSH -> {
                       
                    }
                }
            }
        }
//Notification တစ်ခုကို create လုပ်ပီး target users တွေဆီ ပို့ပေးတယ် / UserNotificationDTO
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
        //Custom notification တစ်ခုကို create လုပ်တယ်
//Scheduled notification ဖြစ်နိုင်တယ်
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
       // Scheduled notifications တွေကို ပို့ပေးတယ်
//1 minute တိုင်း run လုပ်တယ်
//user_notification - undelivered scheduled notifications တွေကို ရှာတယ်
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
        //UserNotificationEntity ကို UserNotificationDTO ပြောင်းပေးတယ်
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
        //Notification တစ်ခုကို read လုပ်တယ်
//Security check လုပ်တယ် (user က သူ့ notification ကိုပဲ read လုပ်နိုင်တယ်)
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
//User တစ်ယောက်ရဲ့ unread notifications အားလုံးကို read လုပ်တယ်
        userNotificationRepository.saveAll(notifications);
    }


    private void sendNamedNotification(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {


        createNotificationAndDeliver(typeName, metadata, targetUserIds);
    }

    // ----------- NOTIFICATION METHODS WITH CORRECT PERMISSION CHECKS -----------

    // ✅ Expose general-purpose trigger method
    public void notify(String typeName, Map<String, Object> metadata, List<Long> targetUserIds) {
        sendNamedNotification(typeName, metadata, targetUserIds);
    }

    public void notifyOrderPending(Long userId, Long orderId, BigDecimal totalAmount, String trackingNum) {
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "trackingNum", trackingNum,
                "totalAmount", totalAmount,
                "trackingNumLink", "/customer/orderDetail/" + orderId
        );
        sendNamedNotification("ORDER_PENDING", metadata, List.of(userId));
    }

    public void notifyOrderStatusUpdate(Long userId, Long orderId, String statusCode,String trackingNum) {
        ;
        System.out.println(trackingNum);
        Map<String, Object> metadata = Map.of(
                "orderId", orderId,
                "trackingNum", trackingNum,
                "trackingNumLink", "/customer/orderDetail/" + orderId
        );
        sendNamedNotification(statusCode, metadata, List.of(userId));
    }





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
        
        System.out.println("🔍 CHECKING LOW STOCK FOR VARIANT: " + variant.getSku() + " | Stock: " + variant.getStock());

        if (variant.getStock() <= LOW_STOCK_THRESHOLD & variant.getStock() != 0) {
            System.out.println("⚠️ LOW STOCK DETECTED! Creating notification...");
            // Optionally check for recent notifications to avoid duplicates (implement if needed)

            Map<String, Object> metadata = Map.of(
                    "productId", variant.getProduct().getId(),
                    "productName", variant.getProduct().getName(),
                    "variantName", variant.getSku(),
                    "stock", variant.getStock(),
                    "productNameLink", "/admin/product/" + variant.getProduct().getId()
            );

            List<Long> adminIds = getAdminIdsWithPermission("PRODUCT_STOCK_UPDATE");
            System.out.println("👥 Admin IDs with permission: " + adminIds);
            
            if (adminIds.isEmpty()) {
                System.out.println("❌ No admin users found with PRODUCT_STOCK_UPDATE permission!");
                return;
            }
            
            sendNamedNotification("LOW_STOCK_ALERT", metadata, adminIds);
            System.out.println("✅ LOW_STOCK_ALERT notification sent!");
        } else {
            System.out.println("✅ Stock is sufficient: " + variant.getStock() + " items");
        }
    }

    public void checkAndNotifyOutOfStock(ProductVariantEntity variant) {
        System.out.println("HI_______________________________________________________________________________outofstock");
        System.out.println("🔍 CHECKING OUT OF STOCK FOR VARIANT: " + variant.getSku() + " | Stock: " + variant.getStock());
        
        if (variant.getStock() <= 0) {  // Out of stock condition
            System.out.println("⚠️ OUT OF STOCK DETECTED! Creating notification...");

            Map<String, Object> metadata = Map.of(
                    "productId", variant.getProduct().getId(),
                    "productName", variant.getProduct().getName(),
                    "variantName", variant.getSku(),
                    "productNameLink", "/admin/product/" + variant.getProduct().getId()
            );

            List<Long> adminIds = getAdminIdsWithPermission("PRODUCT_STOCK_UPDATE");
            System.out.println("👥 Admin IDs with permission: " + adminIds);
            
            if (adminIds.isEmpty()) {
                System.out.println("❌ No admin users found with PRODUCT_STOCK_UPDATE permission!");
                return;
            }
            
            sendNamedNotification("OUT_OF_STOCK_ALERT", metadata, adminIds);
            System.out.println("✅ OUT_OF_STOCK_ALERT notification sent!");
        } else {
            System.out.println("✅ Stock is available: " + variant.getStock() + " items");
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
               // Specific permission ရှိတဲ့ admin user IDs တွေကို ရှာတယ်
//SUPERADMIN_PERMISSION ရှိရင် အားလုံးကို ပို့တယ်
//Role-based access control လုပ်တယ်
    }

    public List<NotificationDTO> getNotificationsByTypeName(String typeName) {
        List<NotificationEntity> entities = notificationRepository.findByType_Name(typeName);
        return entities.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                //Specific notification type ရဲ့ notifications တွေကို ရှာတယ်
    }

    private NotificationDTO convertToDTO(NotificationEntity entity) {
        NotificationDTO dto = new NotificationDTO();
        dto.setTitle(entity.getTitle());
        dto.setMessage(entity.getMessage());
        dto.setImageUrl(entity.getImageUrl());
        dto.setMetadata(entity.getMetadata());
        dto.setScheduledAt(entity.getScheduledAt());
        return dto;
        //NotificationEntity ကို NotificationDTO ပြောင်းပေးတယ်,Custom notifications list အတွက် သုံးတယ
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

// 3. Get product name (assume all wishlists have the same product)
String productName = "";
if (!wishlists.isEmpty() && wishlists.get(0).getProduct() != null) {
    productName = wishlists.get(0).getProduct().getName();
}

        // 4. Prepare notification metadata (add more info if needed)
        Map<String, Object> metadata = Map.of(
                "productId", productId,
                    "productName",productName,
                    "productNameLink","/customer/product/"+productId
               
        );
        sendNamedNotification(
                "STOCK_UPDATE_FOR_WISHLISTEDUSER", 
                metadata,
                userIds
        );
    }
    
    // 👉 Test method for renderTemplate
    public void testRenderTemplate() {
        String template = "Thank you for shopping with us. Your order has been confirmed and is now being processed. Track your order {{trackingNum}}";
        Map<String, Object> metadata = Map.of(
            "trackingNum", "TRK1753722348401434",
            "orderId", 123
        );
        
        String result = jsonService.renderTemplate(template, metadata);
        System.out.println("🧪 TEST RESULT:");
        System.out.println("Template: " + template);
        System.out.println("Metadata: " + metadata);
        System.out.println("Result: " + result);
        System.out.println("Expected: Thank you for shopping with us. Your order has been confirmed and is now being processed. Track your order TRK1753722348401434");
        System.out.println("Match: " + result.equals("Thank you for shopping with us. Your order has been confirmed and is now being processed. Track your order TRK1753722348401434"));
    }

    // Get all notification type methods for admin management
    public List<NotificationDTO.NotificationTypeMethodDTO> getAllNotificationTypeMethods() {
        List<NotificationTypeEntity> types = notificationTypeRepository.findAll();
        List<NotificationDTO.NotificationTypeMethodDTO> result = new ArrayList<>();
        
        for (NotificationTypeEntity type : types) {
            for (NotificationTypeMethodEntity methodEntity : type.getSupportedMethods()) {
                NotificationDTO.NotificationTypeMethodDTO dto = new NotificationDTO.NotificationTypeMethodDTO();
                dto.setNotificationTypeId(type.getId());
                dto.setNotificationTypeName(type.getName());
                dto.setMethod(methodEntity.getMethod());
                dto.setStatus(methodEntity.getDisplayOrder());
                result.add(dto);
            }
        }
        
        return result;
    }

    // Update notification method status
    public void updateNotificationMethodStatus(Long notificationTypeId, NotiMethod method, Integer status) {
        NotificationTypeEntity type = notificationTypeRepository.findById(notificationTypeId)
                .orElseThrow(() -> new RuntimeException("Notification type not found"));
        
        NotificationTypeMethodEntity methodEntity = type.getSupportedMethods().stream()
                .filter(m -> m.getMethod() == method)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Method not found for this notification type"));
        
        methodEntity.setDisplayOrder(status);
        notificationTypeRepository.save(type);
    }

    // Get notification type by ID with message template
    public NotificationTypeEntity getNotificationTypeById(Long id) {
        return notificationTypeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification type not found with id: " + id));
    }
}
