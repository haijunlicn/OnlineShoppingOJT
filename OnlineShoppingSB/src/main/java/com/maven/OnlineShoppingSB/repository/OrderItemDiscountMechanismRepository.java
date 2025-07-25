package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.BrandEntity;
import com.maven.OnlineShoppingSB.entity.OrderItemDiscountMechanismEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderItemDiscountMechanismRepository extends JpaRepository<OrderItemDiscountMechanismEntity, Long> {

}

