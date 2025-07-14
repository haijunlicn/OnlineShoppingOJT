package com.maven.OnlineShoppingSB.audit;

import com.maven.OnlineShoppingSB.entity.CategoryOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
}