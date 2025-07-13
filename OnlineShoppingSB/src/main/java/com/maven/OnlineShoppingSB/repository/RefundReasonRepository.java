package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundReasonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefundReasonRepository extends JpaRepository<RefundReasonEntity, Long> {
    Optional<RefundReasonEntity> findByLabel(String label);
}
