package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.CategoryOptionDTO;
import com.maven.OnlineShoppingSB.service.CategoryOptionService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/category-option")
public class CategoryOptionController {

    @Autowired
    private CategoryOptionService service;

    @PostMapping("/create")
    public ResponseEntity<String> insert(@RequestBody CategoryOptionDTO dto) {
        service.insert(dto);
        return ResponseEntity.ok("CategoryOption created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<CategoryOptionDTO>> getAll() {
        return ResponseEntity.ok(service.getAllCategoryOptions());
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<CategoryOptionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<String> update(@RequestBody CategoryOptionDTO dto) {
        service.update(dto);
        return ResponseEntity.ok("CategoryOption updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("CategoryOption deleted successfully (soft delete)!");
    }

    @PostMapping("/category/{categoryId}/assign")
    public ResponseEntity<String> assignOptionsToCategory(
            @PathVariable Long categoryId,
            @RequestBody List<CategoryOptionDTO> options
    ) {
        service.assignOptionsToCategory(categoryId, options);
        return ResponseEntity.ok("Category options assigned successfully!");
    }

}
