package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DeliveryMethodEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DeliveryMethodRepository extends JpaRepository<DeliveryMethodEntity, Integer> {
    List<DeliveryMethodEntity> findByMinDistanceLessThanEqualAndMaxDistanceGreaterThanEqual(Double distance1, Double distance2);
}