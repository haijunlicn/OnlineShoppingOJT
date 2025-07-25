package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import java.util.Optional;

import com.maven.OnlineShoppingSB.entity.BrandEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import org.springframework.stereotype.Repository;

@Repository
public interface OptionRepository extends JpaRepository<OptionEntity, Long> {
    
   //  List<OptionEntity> findByDeletedFalse();

    List<OptionEntity> findByDelFg(int delFg);

    Optional<OptionEntity> findByName(String name);
}
