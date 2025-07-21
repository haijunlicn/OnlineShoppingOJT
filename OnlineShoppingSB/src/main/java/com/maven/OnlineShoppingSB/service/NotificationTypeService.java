package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.NotificationTypeDTO;
import com.maven.OnlineShoppingSB.entity.NotificationTypeEntity;
import com.maven.OnlineShoppingSB.repository.NotificationTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
    }

    // Get all notification types
    public List<NotificationTypeDTO> getAllNotificationTypesForAdmin() {
        return repo.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
}
