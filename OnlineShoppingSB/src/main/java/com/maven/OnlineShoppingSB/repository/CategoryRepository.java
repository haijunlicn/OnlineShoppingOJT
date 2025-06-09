package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
    //List<CategoryEntity> findByDelFgFalse();
    List<CategoryEntity> findByDelFg(int delFg);

    boolean existsByNameAndParentCategoryIdAndDelFg(String name, Long parentCategoryId, int delFg);

    Optional<CategoryEntity> findByNameAndParentCategoryIdAndDelFg(String name, Long parentCategoryId, int delFg);

}
