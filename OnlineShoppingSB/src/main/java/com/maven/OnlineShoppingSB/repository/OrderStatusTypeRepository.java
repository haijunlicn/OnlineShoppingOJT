package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderStatusTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderStatusTypeRepository extends JpaRepository<OrderStatusTypeEntity, Integer> {
    // No need for findByCode if using statusId
}