package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.PaymentRejectionReasonEntity;
import com.maven.OnlineShoppingSB.entity.RejectionReasonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRejectionReasonRepository extends JpaRepository<PaymentRejectionReasonEntity, Long> {
    Optional<PaymentRejectionReasonEntity> findByLabel(String label);
}