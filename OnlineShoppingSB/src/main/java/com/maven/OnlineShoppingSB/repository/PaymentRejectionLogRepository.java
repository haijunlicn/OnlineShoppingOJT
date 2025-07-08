package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.PaymentRejectionLogEntity;
import com.maven.OnlineShoppingSB.entity.PaymentRejectionReasonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRejectionLogRepository extends JpaRepository<PaymentRejectionLogEntity, Long> {

}
