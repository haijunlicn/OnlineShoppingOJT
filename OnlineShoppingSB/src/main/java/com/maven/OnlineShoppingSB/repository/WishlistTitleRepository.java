package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.WishlistTitleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistTitleRepository extends JpaRepository<WishlistTitleEntity, Long> {
    List<WishlistTitleEntity> findByUserId(Long userId);

}
