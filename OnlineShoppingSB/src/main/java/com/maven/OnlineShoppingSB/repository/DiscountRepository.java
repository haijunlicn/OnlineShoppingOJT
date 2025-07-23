package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountEntity;
import com.maven.OnlineShoppingSB.entity.DiscountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscountRepository extends JpaRepository<DiscountEntity, Integer> {
    // Find all active discounts
    List<DiscountEntity> findByIsActiveTrueAndDelFgFalse();

    // Find all non-deleted discounts
    List<DiscountEntity> findByDelFgFalse();

    // Find by ID and not deleted
    Optional<DiscountEntity> findByIdAndDelFgFalse(Integer id);

    // Find by code (for coupon validation)
    Optional<DiscountEntity> findByCodeAndDelFgFalse(String code);

    // Find by type
    List<DiscountEntity> findByTypeAndDelFgFalse(DiscountType type);

    // Find active discounts by date range
    @Query("SELECT d FROM DiscountEntity d WHERE d.isActive = true AND d.delFg = false " +
            "AND d.startDate <= :currentDate AND d.endDate >= :currentDate")
    List<DiscountEntity> findActiveDiscountsByDate(@Param("currentDate") LocalDateTime currentDate);

    // Check if code exists (excluding specific discount ID for updates)
    @Query("SELECT COUNT(d) > 0 FROM DiscountEntity d WHERE d.code = :code AND d.delFg = false AND d.id != :excludeId")
    boolean existsByCodeAndNotId(@Param("code") String code, @Param("excludeId") Integer excludeId);

    // Check if code exists
    boolean existsByCodeAndDelFgFalse(String code);

    @Query("""
                SELECT d FROM DiscountEntity d
                WHERE d.isActive = true AND d.delFg = false
                AND (d.startDate IS NULL OR d.startDate <= :now)
                AND (d.endDate IS NULL OR d.endDate >= :now)
            """)
    List<DiscountEntity> findAllActivePublicDiscounts(@Param("now") LocalDateTime now);

}
