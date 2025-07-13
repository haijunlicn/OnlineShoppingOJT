package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.RoleDTO;
import com.maven.OnlineShoppingSB.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @PostMapping("/create")
    public ResponseEntity<RoleDTO> insertRole(@RequestBody RoleDTO dto) {
        RoleDTO created = roleService.insertRole(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/list")
    public ResponseEntity<List<RoleDTO>> getAllRoles() {
        List<RoleDTO> dtoList = roleService.getAllRoles();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<RoleDTO> getById(@PathVariable Long id) {
        RoleDTO dto = roleService.getById(id);
        return ResponseEntity.ok(dto);
    }

    // Update Role
    @PutMapping("/update/{id}")
    public ResponseEntity<RoleDTO> updateRole(@PathVariable Long id, @RequestBody RoleDTO dto) {
        dto.setId(id); 
        RoleDTO updated = roleService.updateRole(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ResponseEntity.ok("Role deleted successfully!");
    }
    @GetMapping("/customers")
    public ResponseEntity<List<RoleDTO>> getCustomerRoles() {
        List<RoleDTO> customerRoles = roleService.getCustomerRolesWithUsers();
        return ResponseEntity.ok(customerRoles);
    }
}
