package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.NotificationDTO;
import com.maven.OnlineShoppingSB.entity.NotificationTypeEntity;
import com.maven.OnlineShoppingSB.entity.NotiMethod;
import com.maven.OnlineShoppingSB.service.NotificationTypeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.maven.OnlineShoppingSB.dto.NotificationTypeDTO;

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

    @GetMapping("/methods")
    public ResponseEntity<List<NotificationDTO.NotificationTypeMethodDTO>> getAllNotificationTypeMethods() {
        List<NotificationDTO.NotificationTypeMethodDTO> methods = notificationTypeService.getAllNotificationTypeMethods();
        return ResponseEntity.ok(methods);
    }

    @PutMapping("/methods/{notificationTypeId}/{method}/status")
    public ResponseEntity<Void> updateNotificationMethodStatus(
            @PathVariable Long notificationTypeId,
            @PathVariable String method,
            @RequestParam Integer status) {
        NotiMethod notiMethod = NotiMethod.valueOf(method.toUpperCase());
        notificationTypeService.updateNotificationMethodStatus(notificationTypeId, notiMethod, status);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationTypeDTO> getNotificationTypeById(@PathVariable Long id) {
        NotificationTypeEntity entity = notificationTypeService.getNotificationTypeById(id);
        NotificationTypeDTO dto = convertToDTO(entity);
        return ResponseEntity.ok(dto);
    }

    private NotificationTypeDTO convertToDTO(NotificationTypeEntity entity) {
        NotificationTypeDTO dto = new NotificationTypeDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setTitleTemplate(entity.getTitleTemplate());
        dto.setMessageTemplate(entity.getMessageTemplate());
        dto.setAdminOnly(entity.isAdminOnly());
        return dto;
    }
}
