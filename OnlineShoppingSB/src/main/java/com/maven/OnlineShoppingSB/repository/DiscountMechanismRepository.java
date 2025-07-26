package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountMechanismEntity;
import com.maven.OnlineShoppingSB.entity.MechanismType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountMechanismRepository extends JpaRepository<DiscountMechanismEntity, Long> {
    // Find mechanisms by discount ID
    List<DiscountMechanismEntity> findByDiscountIdAndDelFgFalse(Long discountId);

    // Find mechanisms by type
    List<DiscountMechanismEntity> findByMechanismTypeAndDelFgFalse(MechanismType mechanismType);

    // Delete mechanisms by discount ID (soft delete)
    @Query("UPDATE DiscountMechanismEntity dm SET dm.delFg = true WHERE dm.discount.id = :discountId")
    void softDeleteByDiscountId(@Param("discountId") Long discountId);


}
