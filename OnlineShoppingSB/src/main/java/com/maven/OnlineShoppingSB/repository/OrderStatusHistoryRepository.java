package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderStatusHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistoryEntity, Long> {
}