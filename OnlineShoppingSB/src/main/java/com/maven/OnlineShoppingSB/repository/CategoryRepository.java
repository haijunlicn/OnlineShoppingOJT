package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Integer> {
	//List<CategoryEntity> findByDelFgFalse();
	List<CategoryEntity> findByDelFg(int delFg);
}
