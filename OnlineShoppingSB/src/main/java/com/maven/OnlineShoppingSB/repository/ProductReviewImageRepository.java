package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.ProductReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewImageRepository  extends JpaRepository<ProductReviewImage, Long> {
    List<ProductReviewImage> findByReviewId(Long reviewId);
}
