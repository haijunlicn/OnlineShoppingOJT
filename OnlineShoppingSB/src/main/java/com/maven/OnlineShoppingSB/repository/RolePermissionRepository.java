package com.maven.OnlineShoppingSB.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.RolePermissionEntity;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, Long> {
    List<RolePermissionEntity> findByRoleId(Long roleId);
    List<RolePermissionEntity> findByPermissionId(Integer permissionId);
    void deleteByRoleId(Long roleId);
}