package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.RefundReasonDTO;
import com.maven.OnlineShoppingSB.service.RefundReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/refund-reason")
public class RefundReasonController {

    @Autowired
    private RefundReasonService service;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('REFUND_REASON_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> create(@RequestBody RefundReasonDTO dto) {
    	System.out.println("create reason is running");
        service.insert(dto);
        return ResponseEntity.ok("Refund reason created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<RefundReasonDTO>> list() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RefundReasonDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<String> update(@RequestBody RefundReasonDTO dto) {
    	
    	System.out.println("update reason is running");
        service.update(dto);
        return ResponseEntity.ok("Refund reason updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Refund reason deleted successfully!");
    }
}
