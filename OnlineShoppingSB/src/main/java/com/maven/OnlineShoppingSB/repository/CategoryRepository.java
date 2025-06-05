package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.CategoryEntity;

<<<<<<< Updated upstream
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {
=======
public interface CategoryRepository extends JpaRepository<CategoryEntity, Integer> {
>>>>>>> Stashed changes
	//List<CategoryEntity> findByDelFgFalse();
	List<CategoryEntity> findByDelFg(int delFg);
}
