package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentEntity, Integer> {
    // Add custom queries if needed
}
