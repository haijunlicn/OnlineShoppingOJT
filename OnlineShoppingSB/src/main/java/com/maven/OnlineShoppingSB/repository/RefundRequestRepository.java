package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequestEntity, Long> {

    @EntityGraph(attributePaths = {
            "items", "items.orderItem", "items.reason", "items.rejectionReason", "items.images"
    })
    List<RefundRequestEntity> findAll();

    @Query("SELECT rr FROM RefundRequestEntity rr LEFT JOIN FETCH rr.items WHERE rr.id = :id")
    Optional<RefundRequestEntity> findByIdWithItems(@Param("id") Long id);


}
