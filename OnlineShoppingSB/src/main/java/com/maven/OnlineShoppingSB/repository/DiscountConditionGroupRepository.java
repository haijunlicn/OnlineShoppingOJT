package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountConditionGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountConditionGroupRepository extends JpaRepository<DiscountConditionGroupEntity, Integer> {}
