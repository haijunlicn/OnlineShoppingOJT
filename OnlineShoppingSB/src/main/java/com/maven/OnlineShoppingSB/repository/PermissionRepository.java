package com.maven.OnlineShoppingSB.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.PermissionEntity;

public interface PermissionRepository extends JpaRepository<PermissionEntity, Integer> {
    Optional<PermissionEntity> findByCode(String code);
    boolean existsByCode(String code);

}
