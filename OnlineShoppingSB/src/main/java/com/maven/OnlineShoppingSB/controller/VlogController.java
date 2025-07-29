package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.VlogDTO;
import com.maven.OnlineShoppingSB.service.VlogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/vlog")
public class VlogController {

    @Autowired
    private VlogService vlogService;

    @PostMapping("/create")
    public ResponseEntity<VlogDTO> createVlog(@RequestBody VlogDTO dto) {
        VlogDTO created = vlogService.createVlog(dto);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('BLOG_MANAGEMENT') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<VlogDTO>> getAllVlogs() {
        return ResponseEntity.ok(vlogService.getAllVlogs());
    }

    @GetMapping("/Public/list")
    public ResponseEntity<List<VlogDTO>> PublicgetAllVlogs() {
        return ResponseEntity.ok(vlogService.getAllVlogs());
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<VlogDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vlogService.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateVlog(@RequestBody VlogDTO dto) {
        vlogService.updateVlog(dto);
        return ResponseEntity.ok("Vlog updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteVlog(@PathVariable Long id) {
        vlogService.deleteVlog(id);
        return ResponseEntity.ok("Vlog deleted successfully!");
    }
}
