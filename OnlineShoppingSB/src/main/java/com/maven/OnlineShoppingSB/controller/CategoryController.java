package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<CategoryDTO> insertCategory(@RequestBody CategoryDTO dto) {
        CategoryDTO created = cateService.insertCategory(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/list")
    public ResponseEntity<List<CategoryDTO>> getAllCategories() {
        List<CategoryDTO> dtoList = cateService.getAllCategories();
        System.out.println("category list : " + dtoList);
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/list-with-options")
    public ResponseEntity<List<CategoryDTO>> getAllCategoriesWithOptions() {
        List<CategoryDTO> dtoList = cateService.getAllCategoriesWithOptions();
        System.out.println("cate list with options : " + dtoList);
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<CategoryDTO> getById(@PathVariable Long id) {
        CategoryDTO dto = cateService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<CategoryDTO> updateCategory(@PathVariable Long id, @RequestBody CategoryDTO dto) {
        CategoryDTO updated = cateService.updateCategory(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Long id) {
        cateService.deleteCategory(id);
        return ResponseEntity.ok("Category deleted successfully!");
    }

}
