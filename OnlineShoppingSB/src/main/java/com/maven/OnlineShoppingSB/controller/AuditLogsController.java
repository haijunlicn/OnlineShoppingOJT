package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.audit.AuditEventDTO;
import com.maven.OnlineShoppingSB.dto.AuditLogDTO;
import com.maven.OnlineShoppingSB.service.AuditLogsService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-logs")
public class AuditLogsController {

    private final AuditLogsService auditLogsService;

    @Autowired
    public AuditLogsController(AuditLogsService auditLogsService) {
        this.auditLogsService = auditLogsService;
    }

    @GetMapping("list-by-entity")
    public ResponseEntity<List<AuditEventDTO>> getAuditLogsByEntityType(
            @RequestParam(required = false) String entityType) {

        List<AuditEventDTO> logs;

        if (entityType != null && !entityType.isEmpty()) {
            logs = auditLogsService.getAuditLogsByEntityType(entityType);
        } else {
            logs = auditLogsService.getAllAuditLogs();
        }

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<AuditLogDTO>> getAuditLogsForProduct(@PathVariable Long productId) {
        List<AuditLogDTO> logs = auditLogsService.getAuditLogsForProduct(productId);
        return ResponseEntity.ok(logs);
    }

}
