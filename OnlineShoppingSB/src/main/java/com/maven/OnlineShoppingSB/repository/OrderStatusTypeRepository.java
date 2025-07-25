package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OrderStatusTypeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderStatusTypeRepository extends JpaRepository<OrderStatusTypeEntity, Integer> {

    Optional<OrderStatusTypeEntity> findByCode(String code);

}