package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RejectionReasonEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RejectionReasonRepository extends JpaRepository<RejectionReasonEntity, Long> {
    Optional<RejectionReasonEntity> findByLabel(String label);
}
