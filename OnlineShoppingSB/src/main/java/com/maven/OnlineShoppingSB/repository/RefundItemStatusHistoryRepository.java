package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.RefundItemStatusHistoryEntity;
import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundItemStatusHistoryRepository extends JpaRepository<RefundItemStatusHistoryEntity, Long> {

}
