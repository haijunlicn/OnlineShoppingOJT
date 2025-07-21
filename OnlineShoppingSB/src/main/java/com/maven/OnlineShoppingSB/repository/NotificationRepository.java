package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.NotificationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

	 List<NotificationEntity> findByType_Name(String name);
}