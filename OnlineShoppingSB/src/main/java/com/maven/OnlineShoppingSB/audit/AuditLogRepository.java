package com.maven.OnlineShoppingSB.audit;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findByEntityType(String entityType);

    // Product: Direct entityId match
    @Query("SELECT a FROM AuditLogEntity a WHERE a.entityType = 'Product' AND a.entityId = :productId ORDER BY a.createdAt DESC")
    List<AuditLogEntity> findProductLogs(Long productId);

    // ProductVariant: changedData JSON contains "productId":...
    @Query("SELECT a FROM AuditLogEntity a WHERE a.entityType = 'ProductVariant' AND a.changedData LIKE %:productIdStr% ORDER BY a.createdAt DESC")
    List<AuditLogEntity> findProductVariantLogs(String productIdStr);

    // ProductImage: changedData JSON contains "productId":...
    @Query("SELECT a FROM AuditLogEntity a WHERE a.entityType = 'ProductImage' AND a.changedData LIKE %:productIdStr% ORDER BY a.createdAt DESC")
    List<AuditLogEntity> findProductImageLogs(String productIdStr);
}
