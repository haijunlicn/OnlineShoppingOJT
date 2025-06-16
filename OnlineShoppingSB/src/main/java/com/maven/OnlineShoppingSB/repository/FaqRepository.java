package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.maven.OnlineShoppingSB.entity.FaqEntity;

public interface FaqRepository extends JpaRepository<FaqEntity, Long> {
    List<FaqEntity> findByDelFgFalse();
}
