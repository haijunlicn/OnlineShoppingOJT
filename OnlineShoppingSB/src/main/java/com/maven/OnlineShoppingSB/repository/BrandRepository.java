package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.BrandEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BrandRepository extends JpaRepository<BrandEntity, Long> {
	List<BrandEntity> findByDelFg(int delFg);
	Optional<BrandEntity> findByNameIgnoreCase(String name);
	Optional<BrandEntity> findByBaseSkuIgnoreCase(String baseSku);

	List<BrandEntity> findByNameIgnoreCaseAndDelFg(String name, Integer delFg);
	List<BrandEntity> findByBaseSkuIgnoreCaseAndDelFg(String baseSku, Integer delFg);

}
