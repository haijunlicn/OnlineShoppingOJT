package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.NotiMethod;
import com.maven.OnlineShoppingSB.entity.NotificationEntity;
import com.maven.OnlineShoppingSB.entity.UserNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotificationEntity, Long> {
    List<UserNotificationEntity> findByUserIdAndMethodOrderByDeliveredAtDesc(Long userId, NotiMethod method);
}
