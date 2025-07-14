package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountConditionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscountConditionRepository extends JpaRepository<DiscountConditionEntity, Integer> {}
