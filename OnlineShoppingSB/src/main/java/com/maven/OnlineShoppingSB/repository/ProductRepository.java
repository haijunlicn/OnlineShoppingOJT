package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<ProductEntity, Long> {

    List<OptionEntity> findByDelFg(int delFg);

    List<ProductEntity> findTop10ByCategoryIdAndIdNotOrderByCreatedDateDesc(Long categoryId, Long productId);

    List<ProductEntity> findByCategoryIdIn(List<Long> categoryIds);

    List<ProductEntity> findByBrandIdIn(List<Long> brandIds);

    List<ProductEntity> findByIdIn(List<Long> productIds); // Optional: used elsewhere

    List<ProductEntity> findByDelFgAndBrand_DelFgOrderByCreatedDateDesc(Integer productDelFg, Integer brandDelFg);

    List<ProductEntity> findByDelFgAndBrand_DelFgAndCategory_DelFgOrderByCreatedDateDesc(
            Integer productDelFg,
            Integer brandDelFg,
            Integer categoryDelFg
    );

    @Query("""
                SELECT p FROM ProductEntity p
                WHERE p.delFg = 1
                  AND p.brand IS NOT NULL AND p.brand.delFg = 1
                  AND p.category IS NOT NULL AND p.category.delFg = 1
                ORDER BY p.createdDate DESC
            """)
    List<ProductEntity> findAllActivePublicProducts();

}
