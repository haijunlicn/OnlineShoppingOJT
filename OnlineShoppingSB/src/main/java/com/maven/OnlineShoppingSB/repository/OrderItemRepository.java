package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
     boolean existsByOrderUserIdAndVariantProductId(Long userId, Long productId);
     
     @Query("SELECT COUNT(oi) > 0 FROM OrderItemEntity oi " +
            "WHERE oi.order.user.id = :userId " +
            "AND oi.variant.product.id = :productId " +
            "AND oi.order.currentStatus.code = :statusCode")
     boolean existsByOrderUserIdAndVariantProductIdAndOrderStatus(
         @Param("userId") Long userId, 
         @Param("productId") Long productId, 
         @Param("statusCode") String statusCode
     );

     // Alternative method for debugging
     @Query("SELECT oi FROM OrderItemEntity oi " +
            "WHERE oi.order.user.id = :userId " +
            "AND oi.variant.product.id = :productId")
     List<OrderItemEntity> findByOrderUserIdAndVariantProductId(
         @Param("userId") Long userId, 
         @Param("productId") Long productId
     );
}
