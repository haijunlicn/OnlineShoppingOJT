package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.audit.AuditEventDTO;
import com.maven.OnlineShoppingSB.audit.AuditLogEntity;
import com.maven.OnlineShoppingSB.audit.AuditLogRepository;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AuditLogsService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    public AuditLogsService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    public List<AuditEventDTO> getAllAuditLogs() {
        return convertToDTOList(auditLogRepository.findAll());
    }

    public List<AuditEventDTO> getAuditLogsByEntityType(String entityType) {
        return convertToDTOList(auditLogRepository.findByEntityType(entityType));
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
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return Collections.singletonMap("parseError", "Invalid JSON");
        }
    }
}
