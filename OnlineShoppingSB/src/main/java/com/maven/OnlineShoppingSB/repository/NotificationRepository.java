package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.NotificationEntity;
import com.maven.OnlineShoppingSB.entity.RefundItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

}