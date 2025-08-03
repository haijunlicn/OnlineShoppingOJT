package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.ProductReview;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;



import java.util.List;

@Repository
public interface ProductReviewRepository  extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductId(Long productId, Pageable pageable);
    Page<ProductReview> findByProductIdAndRating(Long productId, Integer rating, Pageable pageable);
    List<ProductReview> findByProductId(Long productId);
    
    @Query("SELECT COUNT(pr) > 0 FROM ProductReview pr WHERE pr.user.id = :userId AND pr.product.id = :productId")
    boolean existsByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") Long productId);
    
    List<ProductReview> findByUserId(Long userId);
}
