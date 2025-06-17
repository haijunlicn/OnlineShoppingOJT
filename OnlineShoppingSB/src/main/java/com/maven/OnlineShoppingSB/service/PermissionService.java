package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.PermissionDTO;
import com.maven.OnlineShoppingSB.entity.PermissionEntity;
import com.maven.OnlineShoppingSB.repository.PermissionRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PermissionService {

    @Autowired
    private PermissionRepository permissionRepo;

    @Autowired
    private ModelMapper mapper;

    public PermissionDTO insertPermission(PermissionDTO dto) {
        PermissionEntity entity = mapper.map(dto, PermissionEntity.class);
        PermissionEntity saved = permissionRepo.save(entity);
        return mapper.map(saved, PermissionDTO.class);
    }

    public List<PermissionDTO> getAllPermissions() {
        return permissionRepo.findAll().stream()
                .map(entity -> mapper.map(entity, PermissionDTO.class))
                .collect(Collectors.toList());
    }

    public PermissionDTO getById(Integer id) {
        PermissionEntity entity = permissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
        return mapper.map(entity, PermissionDTO.class);
    }
    public PermissionDTO updatePermission(PermissionDTO dto) {
        PermissionEntity existing = permissionRepo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Permission not found"));

        existing.setCode(dto.getCode());
        existing.setDescription(dto.getDescription());

        PermissionEntity updated = permissionRepo.save(existing);
        return mapper.map(updated, PermissionDTO.class);
    }

    public void deletePermission(Integer id) {
        PermissionEntity entity = permissionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Permission not found"));
        permissionRepo.delete(entity);
    }
}
