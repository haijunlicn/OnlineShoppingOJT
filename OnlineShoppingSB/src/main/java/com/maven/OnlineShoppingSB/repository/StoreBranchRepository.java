package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.StoreBranch;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreBranchRepository extends JpaRepository<StoreBranch, Integer> {
    StoreBranch findFirstByDelFgTrue();
}
