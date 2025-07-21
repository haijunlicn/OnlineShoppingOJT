package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.ProductQuestionEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductQuestionRepository extends JpaRepository<ProductQuestionEntity, Long> {
    Page<ProductQuestionEntity> findByProductId(Long productId, Pageable pageable);
}
