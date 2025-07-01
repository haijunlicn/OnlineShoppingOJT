package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.PermissionDTO;
import com.maven.OnlineShoppingSB.dto.RoleDTO;
import com.maven.OnlineShoppingSB.entity.PermissionEntity;
import com.maven.OnlineShoppingSB.entity.RoleEntity;
import com.maven.OnlineShoppingSB.entity.RolePermissionEntity;
import com.maven.OnlineShoppingSB.repository.PermissionRepository;
import com.maven.OnlineShoppingSB.repository.RolePermissionRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private static final int CUSTOMER_ROLE_ID = 1;
    private static final int SUPERADMIN_ROLE_ID = 2;

    @Autowired
    private RoleRepository roleRepo;

    @Autowired
    private PermissionRepository permissionRepo;

    @Autowired
    private RolePermissionRepository rolePermissionRepo;

    @Autowired
    private ModelMapper mapper;

    public RoleDTO insertRole(RoleDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Role name must not be empty");
        }
//        if (dto.getId() == CUSTOMER_ROLE_ID || dto.getId() == SUPERADMIN_ROLE_ID ||
//                "customer".equalsIgnoreCase(dto.getName()) || "superadmin".equalsIgnoreCase(dto.getName())) {
//            throw new RuntimeException("Cannot create system default roles.");
//        }

        RoleEntity role = new RoleEntity();
        role.setName(dto.getName());
        role.setType(dto.getType());
        role.setDelFg(1);

        RoleEntity savedRole = roleRepo.save(role);

        if (dto.getPermissions() != null && !dto.getPermissions().isEmpty()) {
            for (PermissionDTO permDTO : dto.getPermissions()) {
                PermissionEntity perm = permissionRepo.findById(permDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Permission not found with id: " + permDTO.getId()));
                RolePermissionEntity rp = new RolePermissionEntity();
                rp.setRole(savedRole);
                rp.setPermission(perm);
                rolePermissionRepo.save(rp);
            }
        }

        return convertToDTO(savedRole);
    }

    public List<RoleDTO> getAllRoles() {
        List<RoleEntity> roles = roleRepo.findByDelFg(1);
        return roles.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public RoleDTO getById(Long id) {
        RoleEntity role = roleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        return convertToDTO(role);
    }

    @Transactional
    public RoleDTO updateRole(RoleDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Role ID must not be null for update");
        }
        if (dto.getId() == CUSTOMER_ROLE_ID) {
            throw new RuntimeException("Customer role cannot be updated.");
        }

        RoleEntity role = roleRepo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + dto.getId()));

        role.setName(dto.getName());
        role.setType(dto.getType());

        RoleEntity updated = roleRepo.save(role);

        rolePermissionRepo.deleteByRoleId(updated.getId());

        if (dto.getPermissions() != null && !dto.getPermissions().isEmpty()) {
            for (PermissionDTO permDTO : dto.getPermissions()) {
                PermissionEntity perm = permissionRepo.findById(permDTO.getId())
                        .orElseThrow(() -> new RuntimeException("Permission not found with id: " + permDTO.getId()));
                RolePermissionEntity rp = new RolePermissionEntity();
                rp.setRole(updated);
                rp.setPermission(perm);
                rolePermissionRepo.save(rp);
            }
        }

        return convertToDTO(updated);
    }

    public void deleteRole(Long id) {
        if (id == CUSTOMER_ROLE_ID || id == SUPERADMIN_ROLE_ID) {
            throw new RuntimeException("Cannot delete system default roles.");
        }

        RoleEntity role = roleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
        role.setDelFg(0);
        roleRepo.save(role);
    }

    private RoleDTO convertToDTO(RoleEntity entity) {
        RoleDTO dto = new RoleDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setDelFg(entity.getDelFg());

        List<RolePermissionEntity> rolePermissions = rolePermissionRepo.findByRoleId(entity.getId());
        List<PermissionDTO> permDTOs = rolePermissions.stream()
                .map(rp -> mapper.map(rp.getPermission(), PermissionDTO.class))
                .collect(Collectors.toList());

        dto.setPermissions(permDTOs);

        return dto;
    }
}