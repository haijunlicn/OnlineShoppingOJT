package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<OptionEntity> findByDelFg(int delFg);

    List<ProductEntity> findTop10ByCategoryIdAndIdNotOrderByCreatedDateDesc(Long categoryId, Long productId);

    List<ProductEntity> findByCategoryIdIn(List<Long> categoryIds);

    List<ProductEntity> findByBrandIdIn(List<Long> brandIds);

    List<ProductEntity> findByIdIn(List<Long> productIds); // Optional: used elsewhere

}
