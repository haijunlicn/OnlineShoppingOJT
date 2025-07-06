package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.RejectionReasonDTO;
import com.maven.OnlineShoppingSB.service.RejectionReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/rejection-reason")
public class RejectionReasonController {

    @Autowired
    private RejectionReasonService service;

    @PostMapping("/create")
    public ResponseEntity<String> create(@RequestBody RejectionReasonDTO dto) {
        service.insert(dto);
        return ResponseEntity.ok("Rejection reason created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<RejectionReasonDTO>> list() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RejectionReasonDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<String> update(@RequestBody RejectionReasonDTO dto) {
        service.update(dto);
        return ResponseEntity.ok("Rejection reason updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Rejection reason deleted successfully!");
    }
}
