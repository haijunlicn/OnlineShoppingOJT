package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.PermissionDTO;
import com.maven.OnlineShoppingSB.service.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/permission")
public class PermissionController {

    @Autowired
    private PermissionService permissionService;

    @PostMapping("/create")
    public ResponseEntity<PermissionDTO> insertPermission(@RequestBody PermissionDTO dto) {
        PermissionDTO created = permissionService.insertPermission(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/list")
    public ResponseEntity<List<PermissionDTO>> getAllPermissions() {
        List<PermissionDTO> dtoList = permissionService.getAllPermissions();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<PermissionDTO> getById(@PathVariable Integer id) {
        PermissionDTO dto = permissionService.getById(id);
        return ResponseEntity.ok(dto);
    }
    @PutMapping("/update/{id}")
    public ResponseEntity<PermissionDTO> updatePermission(@PathVariable Integer id, @RequestBody PermissionDTO dto) {
        dto.setId(id);
        PermissionDTO updated = permissionService.updatePermission(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Integer id) {
        permissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    
}
