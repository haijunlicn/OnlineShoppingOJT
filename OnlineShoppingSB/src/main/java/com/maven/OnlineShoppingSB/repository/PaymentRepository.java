package com.maven.OnlineShoppingSB.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.PaymentEntity;

import java.util.List;
import java.util.Optional;
@Repository
public interface PaymentRepository extends JpaRepository<PaymentEntity, Integer> {

    Optional<PaymentEntity> findByMethodName(String methodName);
    List<PaymentEntity> findByStatus(int status);
}