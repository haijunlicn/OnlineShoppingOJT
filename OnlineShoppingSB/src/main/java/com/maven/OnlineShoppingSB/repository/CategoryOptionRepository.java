package com.maven.OnlineShoppingSB.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.CategoryOptionEntity;

public interface CategoryOptionRepository extends JpaRepository<CategoryOptionEntity, Long> {
    List<CategoryOptionEntity> findByCategoryId(Long categoryId);
    List<CategoryOptionEntity> findByOptionId(Integer optionId);
    List<CategoryOptionEntity> findByCategoryIdAndDelFg(Long categoryId, Integer delFg);
}
