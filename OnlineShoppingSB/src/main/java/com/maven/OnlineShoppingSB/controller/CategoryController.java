package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<String> insertCategory(@RequestBody CategoryDTO dto) {
        cateService.insertCategory(dto);
        return ResponseEntity.ok("Category created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> dtoList = cateService.getAllCategories();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<CategoryDTO> getById(@PathVariable Integer id) {
        CategoryDTO dto = cateService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateCategory(@RequestBody CategoryDTO dto) {
        cateService.updateCategory(dto);
        return ResponseEntity.ok("Category updated successfully!");
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Integer id) {
        cateService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully!");
    }

}
