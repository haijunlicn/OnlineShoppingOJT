package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.FreeGiftEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FreeGiftRepository extends JpaRepository<FreeGiftEntity, Integer> {

    List<FreeGiftEntity> findByMechanismId(Integer mechanismId);

}
