package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountUsageEntity;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DiscountUsageRepository extends JpaRepository<DiscountUsageEntity, Long> {

    Optional<DiscountUsageEntity> findByDiscountMechanismIdAndUserId(Long mechanismId, Long userId);

    @Query("SELECT SUM(u.usageCount) FROM DiscountUsageEntity u WHERE u.discountMechanism.id = :mechanismId")
    Integer findTotalUsage(@Param("mechanismId") Long mechanismId);

    List<DiscountUsageEntity> findByDiscountMechanismId(Long mechanismId);
}
