package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.OrderEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.service.JsonService;
import com.maven.OnlineShoppingSB.service.NotificationService;
import com.maven.OnlineShoppingSB.service.OrderService;
import com.maven.OnlineShoppingSB.service.UserNotificationService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/notifications")
@CrossOrigin(origins = "http://localhost:4200")
@RequiredArgsConstructor
public class NotificationController {

    @Autowired
    private JsonService jsonService;

    @Autowired
    private UserNotificationService userNotificationService;

    private final NotificationService notificationService;

    @PostMapping("/test")
    public ResponseEntity<NotificationDTO.MessageResponse> testNotify(@RequestBody NotificationDTO.TestNotificationRequest request) {
        Map<String, Object> metadataMap = jsonService.fromJson(request.getMetadata());

        notificationService.createNotificationAndDeliver(
                request.getType(),
                metadataMap,
                request.getTargetUserIds()
        );

        return ResponseEntity.ok(new NotificationDTO.MessageResponse("Notification sent!"));
    }

    @PostMapping("/trigger")
    public ResponseEntity<?> triggerNotification(
            @RequestBody NotificationDTO.TriggerNotificationRequest req,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        UserEntity sender = principal.getUser();
        notificationService.createNotificationAndDeliver(
                req.getType(),
                req.getMetadata(),
                req.getTargetUserIds()
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/in-app/{userId}")
    public List<UserNotificationDTO> getInAppNotifications(@PathVariable Long userId) {
        return userNotificationService.getInAppNotificationsForUser(userId);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        UserEntity user = userDetails.getUser();
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        UserEntity user = userDetails.getUser();
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/custom")
    public ResponseEntity<?> createCustomNotification(@RequestBody NotificationDTO dto) {
        notificationService.createCustomNotification(dto);
        return ResponseEntity.ok().build();
    }

}
