package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<ProductEntity, Long> {
    
   //  List<OptionEntity> findByDeletedFalse();

    List<OptionEntity> findByDelFg(int delFg);
}
