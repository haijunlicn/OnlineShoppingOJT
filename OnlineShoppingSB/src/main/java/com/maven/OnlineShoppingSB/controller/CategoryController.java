package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.CategoryDTO;
import com.maven.OnlineShoppingSB.service.CategoryService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/category")
public class CategoryController {

    @Autowired
    private CategoryService cateService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<CategoryDTO> insertCategory(@RequestBody CategoryDTO dto) {
        CategoryDTO created = cateService.insertCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('CATEGORY_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        return ResponseEntity.ok(cateService.getAllCategories());
    }

    @GetMapping("/public/list")
    public ResponseEntity<List<CategoryDTO>> getAllPublicCategories() {
        return ResponseEntity.ok(cateService.getAllCategories());
    }

    @GetMapping("/list-with-options")
    @PreAuthorize("hasAuthority('CATEGORY_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<CategoryDTO>> getAllCategoriesWithOptions() {
        return ResponseEntity.ok(cateService.getAllCategoriesWithOptions());
    }

    @GetMapping("/getbyid/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<CategoryDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(cateService.getById(id));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO dto) {
        CategoryDTO updated = cateService.updateCategory(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('CATEGORY_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        cateService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully!");
    }

}
