package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.NotificationTypeEntity;
import com.maven.OnlineShoppingSB.entity.RefundItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationTypeRepository extends JpaRepository<NotificationTypeEntity, Long> {
    Optional<NotificationTypeEntity> findByName(String name);
}
