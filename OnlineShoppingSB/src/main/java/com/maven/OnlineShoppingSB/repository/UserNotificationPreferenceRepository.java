package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundItemEntity;
import com.maven.OnlineShoppingSB.entity.UserNotificationPreferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationPreferenceRepository extends JpaRepository<UserNotificationPreferenceEntity, Long> {

    Optional<UserNotificationPreferenceEntity> findByUserIdAndNotificationTypeId(Long userId, Long notificationTypeId);

    List<UserNotificationPreferenceEntity> findByUserIdAndEnabledTrue(Long userId);
}
