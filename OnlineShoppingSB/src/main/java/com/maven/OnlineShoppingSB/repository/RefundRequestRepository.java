package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRequestRepository extends JpaRepository<RefundRequestEntity, Long> {

    @EntityGraph(attributePaths = {
            "items", "items.orderItem", "items.reason", "items.rejectionReason", "items.images"
    })
    List<RefundRequestEntity> findAll();

}
