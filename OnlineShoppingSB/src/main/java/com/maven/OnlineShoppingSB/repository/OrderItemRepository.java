package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItemEntity, Long> {
}
