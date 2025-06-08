package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.ProductOptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductOptionRepository extends JpaRepository<ProductOptionEntity, Long> {
    List<ProductOptionEntity> findByProduct(ProductEntity product);
}