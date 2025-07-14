package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.FreeGiftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FreeGiftRepository extends JpaRepository<FreeGiftEntity, Integer> {
}
