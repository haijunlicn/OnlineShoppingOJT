package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.CustomerGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerGroupRepository extends JpaRepository<CustomerGroupEntity, Integer> {}
