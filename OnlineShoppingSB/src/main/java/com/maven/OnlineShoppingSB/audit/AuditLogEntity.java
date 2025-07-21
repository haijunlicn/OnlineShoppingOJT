package com.maven.OnlineShoppingSB.audit;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private String entityType;
    private Long entityId;

    @Column(columnDefinition = "TEXT")
    private String changedData; // JSON

    private Long performedBy;
    private String performedByType;

    private String ipAddress;
    private String userAgent;

    private LocalDateTime createdAt = LocalDateTime.now();
}
