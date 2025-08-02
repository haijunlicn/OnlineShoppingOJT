package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountConditionGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountConditionGroupRepository extends JpaRepository<DiscountConditionGroupEntity, Integer> {
    
    @Query("SELECT dcg FROM DiscountConditionGroupEntity dcg WHERE dcg.Group.id = :groupId")
    List<DiscountConditionGroupEntity> findByGroupId(@Param("groupId") Long groupId);
}
