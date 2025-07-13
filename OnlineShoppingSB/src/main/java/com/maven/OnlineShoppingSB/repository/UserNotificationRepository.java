package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.NotiMethod;
import com.maven.OnlineShoppingSB.entity.NotificationEntity;
import com.maven.OnlineShoppingSB.entity.UserNotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotificationEntity, Long> {

    List<UserNotificationEntity> findByUserIdAndMethodOrderByDeliveredAtDesc(Long userId, NotiMethod method);

    boolean existsByUserIdAndNotificationIdAndMethod(Long userId, Long notificationId, NotiMethod method);

    List<UserNotificationEntity> findAllByUserIdAndReadIsFalse(Long userId);

    @Query("SELECT u FROM UserNotificationEntity u " +
            "WHERE u.deliveredAt IS NULL " +
            "AND u.notification.scheduledAt <= :now " +
            "AND u.notification.delivered = false")
    List<UserNotificationEntity> findUndeliveredScheduledNotifications(@Param("now") LocalDateTime now);

}
