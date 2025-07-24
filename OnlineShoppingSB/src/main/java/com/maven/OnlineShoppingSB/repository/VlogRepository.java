package com.maven.OnlineShoppingSB.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.VlogEntity;

@Repository
public interface VlogRepository extends JpaRepository<VlogEntity, Long> {
}