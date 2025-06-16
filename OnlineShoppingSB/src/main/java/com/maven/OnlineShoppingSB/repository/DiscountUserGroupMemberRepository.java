package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountUserGroupMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscountUserGroupMemberRepository extends JpaRepository<DiscountUserGroupMemberEntity, Long> {
    // Optional: Find all members by group id
    List<DiscountUserGroupMemberEntity> findByGroupId(Long groupId);
    boolean existsByGroupIdAndUserId(Long groupId, Long userId);
}