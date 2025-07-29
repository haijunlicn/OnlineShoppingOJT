package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.WishlistEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistRepository extends JpaRepository<WishlistEntity, Long> {
    List<WishlistEntity> findByWishlistTitleId(Long wishlistTitleId);
    List<WishlistEntity> findByWishlistTitleUserId(Long userId);
    List<WishlistEntity> findByWishlistTitleUserIdAndWishlistTitleId(Long userId, Long titleId);
    List<WishlistEntity> findByProductId(Long productId);
    void deleteByWishlistTitleUserIdAndProductId(Long userId, Long productId);

}
