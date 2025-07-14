package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderStatusTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderStatusTypeRepository extends JpaRepository<OrderStatusTypeEntity, Integer> {

    Optional<OrderStatusTypeEntity> findByCode(String code);

}