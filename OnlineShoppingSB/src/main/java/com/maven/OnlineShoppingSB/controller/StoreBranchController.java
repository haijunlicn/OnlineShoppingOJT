package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.StoreBranchDto;
import com.maven.OnlineShoppingSB.service.StoreBranchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/store-branches")
@CrossOrigin(origins = "http://localhost:4200")
public class StoreBranchController {
    @Autowired
    private StoreBranchService service;

    @PostMapping("/save")
    public StoreBranchDto create(@RequestBody StoreBranchDto dto) {
        return service.create(dto);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('STORE_MANAGEMENT') or hasRole('SUPERADMIN')")
    public List<StoreBranchDto> getAll() {
        return service.getAll();
    }

    @GetMapping("/getId/{id}")
    public StoreBranchDto getById(@PathVariable Integer id) {
        return service.getById(id);
    }

    @PutMapping("/edit/{id}")
    public StoreBranchDto update(@PathVariable Integer id, @RequestBody StoreBranchDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/delete/{id}")
    public void delete(@PathVariable Integer id) {
        service.deleteById(id);
    }

    @PutMapping("/set-in-use/{id}")
    public void setStoreInUse(@PathVariable Integer id) {
        service.setStoreInUse(id);
    }

    @GetMapping("/active")
    public StoreBranchDto getActiveStore() {
        return service.getActiveStore();
    }
}
