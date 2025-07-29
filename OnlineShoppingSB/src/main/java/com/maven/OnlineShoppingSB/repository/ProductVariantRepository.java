package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.ProductVariantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariantEntity, Long> {

    List<ProductVariantEntity> findByProductId(Long productId);

    List<ProductVariantEntity> findByProductIdAndDelFg(Long productId, Integer delFg);

    void deleteByProductId(Long productId);

    @Query("SELECT v FROM ProductVariantEntity v WHERE v.product.id = :productId AND v.delFg = 0")
    List<ProductVariantEntity> findDeletedVariantsByProductId(@Param("productId") Long productId);

}
