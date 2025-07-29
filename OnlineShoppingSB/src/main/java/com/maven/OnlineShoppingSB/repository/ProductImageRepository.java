package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.ProductImageEntity;
import com.maven.OnlineShoppingSB.entity.ProductOptionEntity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImageEntity, Long> {

    List<ProductImageEntity> findByProductId(Long productId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ProductImageEntity i WHERE i.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}