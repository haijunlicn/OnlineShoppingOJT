package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.RoleDTO;
import com.maven.OnlineShoppingSB.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/role-permission")
public class Role_PermissionsController {

    @Autowired
    private RoleService roleService;

    @PutMapping("/update-permissions/{roleId}")
    public ResponseEntity<RoleDTO> updateRolePermissions(@PathVariable Integer roleId, @RequestBody RoleDTO dto) {
        dto.setId(roleId);
        RoleDTO updated = roleService.updateRole(dto);
        return ResponseEntity.ok(updated);
    }
}
