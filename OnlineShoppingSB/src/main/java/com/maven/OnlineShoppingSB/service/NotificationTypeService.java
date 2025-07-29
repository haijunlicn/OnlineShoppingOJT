package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.NotificationTypeDTO;
import com.maven.OnlineShoppingSB.dto.NotificationDTO;
import com.maven.OnlineShoppingSB.entity.NotificationTypeEntity;
import com.maven.OnlineShoppingSB.entity.NotificationTypeMethodEntity;
import com.maven.OnlineShoppingSB.entity.NotiMethod;
import com.maven.OnlineShoppingSB.repository.NotificationTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationTypeService {

    @Autowired
    private NotificationTypeRepository repo;

    public NotificationTypeDTO createNotificationTypeForAdmin(NotificationTypeDTO dto) {
        Optional<NotificationTypeEntity> existing = repo.findByName(dto.getName());
        if (existing.isPresent()) {
            throw new RuntimeException("Notification type with this name already exists.");
        }

        NotificationTypeEntity entity = new NotificationTypeEntity();
        entity.setName(dto.getName());
        entity.setTitleTemplate(dto.getTitleTemplate());
        entity.setAdminOnly(dto.isAdminOnly());
        entity.setMessageTemplate(""); // Set default or extend DTO to accept this
        entity.setShowToast(false);    // Default value

        NotificationTypeEntity saved = repo.save(entity);
        return convertToDTO(saved);
        //Admin အတွက် notification type အသစ် create လုပ်တယ်
        //notification_type - notification type ကို save လုပ်တ
    }

    // Get all notification types
    public List<NotificationTypeDTO> getAllNotificationTypesForAdmin() {
        return repo.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
                //Notification types အားလုံးကို ပြန်ပေးတယ်
//သုံးတဲ့ Tables:
//notification_type - အားလုံးကို ရှာတယ်
    }

    // Get notification type by ID
    public NotificationTypeDTO getById(Long id) {
        NotificationTypeEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification type not found with id: " + id));
        return convertToDTO(entity);
    }

    // Delete notification type (hard delete)
    public void deleteNotificationType(Long id) {
        NotificationTypeEntity existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification type not found with id: " + id));
        repo.delete(existing);
    }

    // Helper to convert entity to DTO
    private NotificationTypeDTO convertToDTO(NotificationTypeEntity entity) {
        NotificationTypeDTO dto = new NotificationTypeDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setTitleTemplate(entity.getTitleTemplate());
        dto.setAdminOnly(entity.isAdminOnly());
        return dto;
    }

    // Get all notification type methods for admin management
    public List<NotificationDTO.NotificationTypeMethodDTO> getAllNotificationTypeMethods() {
        List<NotificationTypeEntity> types = repo.findAll();
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
        NotificationTypeEntity type = repo.findById(notificationTypeId)
                .orElseThrow(() -> new RuntimeException("Notification type not found"));
        
        NotificationTypeMethodEntity methodEntity = type.getSupportedMethods().stream()
                .filter(m -> m.getMethod() == method)
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Method not found for this notification type"));
        
        methodEntity.setDisplayOrder(status);
        repo.save(type);
    }

    // Get notification type by ID with message template
    public NotificationTypeEntity getNotificationTypeById(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification type not found with id: " + id));
    }
}
