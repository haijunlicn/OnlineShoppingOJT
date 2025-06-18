package com.maven.OnlineShoppingSB.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import com.maven.OnlineShoppingSB.entity.PolicyEntity;

@Repository
public interface PolicyRepository extends JpaRepository<PolicyEntity, Integer> {

	   List<PolicyEntity> findByType(String type);
}
