package com.maven.OnlineShoppingSB.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.maven.OnlineShoppingSB.entity.RolePermissionEntity;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, Integer> {
    List<RolePermissionEntity> findByRoleId(Integer roleId);
    List<RolePermissionEntity> findByPermissionId(Integer permissionId);
    void deleteByRoleId(Integer roleId);
}