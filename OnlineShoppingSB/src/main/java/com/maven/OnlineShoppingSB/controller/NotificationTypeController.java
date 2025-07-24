package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.NotificationTypeDTO;
import com.maven.OnlineShoppingSB.service.NotificationTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notification-types")
public class NotificationTypeController {

    private final NotificationTypeService notificationTypeService;

    @Autowired
    public NotificationTypeController(NotificationTypeService notificationTypeService) {
        this.notificationTypeService = notificationTypeService;
    }

    @GetMapping("/list")
    public ResponseEntity<List<NotificationTypeDTO>> getAllNotificationTypes() {
        List<NotificationTypeDTO> types = notificationTypeService.getAllNotificationTypesForAdmin();
        return ResponseEntity.ok(types);
    }

    @PostMapping("/create")
    public ResponseEntity<NotificationTypeDTO> createForAdmin(@RequestBody NotificationTypeDTO dto) {
        NotificationTypeDTO created = notificationTypeService.createNotificationTypeForAdmin(dto);
        return ResponseEntity.ok(created);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deleteNotificationType(@PathVariable Long id) {
        notificationTypeService.deleteNotificationType(id);
        return ResponseEntity.noContent().build(); 
    }
}
