package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundItemEntity;
import com.maven.OnlineShoppingSB.entity.RefundItemStatus;
import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundItemRepository extends JpaRepository<RefundItemEntity, Long> {

    @Query("""
                SELECT COALESCE(SUM(ri.quantity), 0)
                FROM RefundItemEntity ri
                WHERE ri.orderItem.id = :orderItemId
                  AND ri.status NOT IN (:excludedStatuses)
            """)
    int sumReturnedQuantityByOrderItemId(
            @Param("orderItemId") Long orderItemId,
            @Param("excludedStatuses") List<RefundItemStatus> excludedStatuses
    );

    @Query("""
                SELECT i.orderItem.id, SUM(i.quantity)
                FROM RefundItemEntity i
                WHERE i.orderItem.order.id = :orderId
                  AND i.status NOT IN :excluded
                GROUP BY i.orderItem.id
            """)
    List<Object[]> sumReturnedQtyByOrderId(@Param("orderId") Long orderId, @Param("excluded") List<RefundItemStatus> excluded);

}
