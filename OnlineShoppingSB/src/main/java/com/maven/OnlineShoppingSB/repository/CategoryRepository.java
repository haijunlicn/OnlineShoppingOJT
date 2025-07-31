package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.maven.OnlineShoppingSB.entity.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
    //List<CategoryEntity> findByDelFgFalse();
    List<CategoryEntity> findByDelFg(int delFg);

    boolean existsByNameAndParentCategoryIdAndDelFg(String name, Long parentCategoryId, int delFg);

    Optional<CategoryEntity> findByNameAndParentCategoryIdAndDelFg(String name, Long parentCategoryId, int delFg);

    @Query(value = """
        SELECT 
            c.id,
            c.name,
            c.img_path,
            c.parent_category_id,
            pc.name as parent_category_name,
            (SELECT COUNT(DISTINCT p2.id) FROM products p2 WHERE p2.category_id = c.id) as product_count
        FROM categories c
        LEFT JOIN categories pc ON c.parent_category_id = pc.id
        WHERE c.del_fg = 1
        ORDER BY c.name ASC
        """, nativeQuery = true)
    List<Object[]> findAllCategoriesWithProductCounts();

    @Query(value = """
        SELECT 
            prod.category_id as category_id,
            COUNT(oi.id) as order_count
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products prod ON pv.product_id = prod.id
        WHERE prod.category_id IS NOT NULL
        GROUP BY prod.category_id
        ORDER BY order_count DESC
        """, nativeQuery = true)
    List<Object[]> findCategoryOrderCounts();
}
