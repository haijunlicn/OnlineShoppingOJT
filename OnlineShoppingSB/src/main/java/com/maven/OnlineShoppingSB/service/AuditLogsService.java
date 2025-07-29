package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.audit.AuditEventDTO;
import com.maven.OnlineShoppingSB.audit.AuditLogEntity;
import com.maven.OnlineShoppingSB.audit.AuditLogRepository;
import com.maven.OnlineShoppingSB.dto.AuditLogDTO;
import com.maven.OnlineShoppingSB.entity.ProductVariantEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.ProductRepository;
import com.maven.OnlineShoppingSB.repository.ProductVariantRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuditLogsService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepo;
    private final ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    public AuditLogsService(AuditLogRepository auditLogRepository, UserRepository userRepository, ProductVariantRepository productVariantRepo) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
        this.productVariantRepo = productVariantRepo;
    }

    public List<AuditEventDTO> getAllAuditLogs() {
        return convertToDTOList(auditLogRepository.findAll());
    }

    public List<AuditEventDTO> getAuditLogsByEntityType(String entityType) {
        return convertToDTOList(auditLogRepository.findByEntityType(entityType));
    }

    public List<AuditLogDTO> getAuditLogsForProduct(Long productId) {
        String match = "\"productId\":" + productId;

        List<AuditLogEntity> logs = new ArrayList<>();
        logs.addAll(auditLogRepository.findProductLogs(productId));
        logs.addAll(auditLogRepository.findProductVariantLogs(match));
        logs.addAll(auditLogRepository.findProductImageLogs(match));

        return logs.stream()
                .map(this::toAuditLogDTO)
                .collect(Collectors.toList()); // No sorting needed
    }

    private AuditEventDTO convertToDTO(AuditLogEntity entity) {
        Map<String, Object> parsedChanges = parseJsonToMap(entity.getChangedData());

        return new AuditEventDTO(
                entity.getAction(),
                entity.getEntityType(),
                entity.getEntityId(),
                parsedChanges,
                entity.getPerformedBy(), // assuming this is userId
                resolveUsername(entity.getPerformedBy(), entity.getPerformedByType()),
                entity.getPerformedByType(),
                entity.getIpAddress(),
                entity.getUserAgent()
        );
    }


    private List<AuditEventDTO> convertToDTOList(List<AuditLogEntity> logs) {
        List<AuditEventDTO> dtoList = new ArrayList<>();

        for (AuditLogEntity log : logs) {
            String username = userRepository.findById(log.getPerformedBy())
                    .map(UserEntity::getName)
                    .filter(name -> name != null && !name.trim().isEmpty())
                    .orElse("Unknown");

            // Debug print to verify user info
            System.out.println("PerformedBy ID: " + log.getPerformedBy() + ", Username: '" + username + "'");

            Map<String, Object> changedData = parseJsonToMap(log.getChangedData());

            AuditEventDTO dto = new AuditEventDTO(
                    log.getAction(),
                    log.getEntityType(),
                    log.getEntityId(),
                    changedData,
                    log.getPerformedBy(),
                    username,
                    log.getPerformedByType(),
                    log.getIpAddress(),
                    log.getUserAgent()
            );
            dtoList.add(dto);
        }
        return dtoList;
    }

    private Map<String, Object> parseJsonToMap(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyMap();

        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            return Collections.singletonMap("parseError", "Invalid JSON");
        }
    }

    private String resolveUsername(Long userId, String userType) {
        if ("superadmin".equalsIgnoreCase(userType)) {
            return userRepository.findById(userId).map(UserEntity::getName).orElse("Unknown");
        }
        // Add other user types if needed
        return "Unknown";
    }

//    public AuditLogDTO toAuditLogDTO(AuditLogEntity log) {
//        String entityType = log.getEntityType();
//        Long entityId = log.getEntityId();
//        String changedData = log.getChangedData(); // 🔧 keep as-is for DTO
//
//        Object affectedEntity = null;
//        switch (entityType) {
//            case "Product":
//                affectedEntity = productRepo.findById(entityId).orElse(null);
//                break;
//            case "ProductVariant":
//                affectedEntity = productVariantRepo.findById(entityId).orElse(null);
//                break;
//            // Add other entity types as needed
//        }
//
//        String username = userRepository.findById(log.getPerformedBy())
//                .map(UserEntity::getName)
//                .orElse("Unknown");
//
//        AuditLogDTO dto = new AuditLogDTO();
//        dto.setAction(log.getAction());
//        dto.setEntityType(entityType);
//        dto.setEntityId(entityId);
//        dto.setChangedData(changedData); // ✅ pass string here
//        dto.setUserId(log.getPerformedBy());
//        dto.setUserType(log.getPerformedByType());
//        dto.setUsername(username);
//        dto.setCreatedDate(log.getCreatedAt());
//        dto.setAffectedEntity(affectedEntity);
//
//        return dto;
//    }

    public AuditLogDTO toAuditLogDTO(AuditLogEntity entity) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setAction(entity.getAction());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setChangedData(entity.getChangedData());
        dto.setUserId(entity.getPerformedBy());
        dto.setUserType(entity.getPerformedByType());

        String username = userRepository.findById(entity.getPerformedBy())
                .map(UserEntity::getName)
                .orElse("Unknown");

        dto.setUsername(username);
        dto.setCreatedDate(entity.getCreatedAt());
        return dto;
    }

}
