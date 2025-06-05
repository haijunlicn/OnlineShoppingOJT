package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.BrandDTO;
import com.maven.OnlineShoppingSB.service.BrandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/brand")
public class BrandController {

    @Autowired
    private BrandService brandService;

    @PostMapping("/create")
    public ResponseEntity<String> insertBrand(@RequestBody BrandDTO dto) {
        brandService.insertBrand(dto);
        return ResponseEntity.ok("Brand created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<BrandDTO>> getAllBrands() {
        List<BrandDTO> dtoList = brandService.getAllBrands();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<BrandDTO> getById(@PathVariable Long id) {
        BrandDTO dto = brandService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateBrand(@RequestBody BrandDTO dto) {
        brandService.updateBrand(dto);
        return ResponseEntity.ok("Brand updated successfully!");
    }
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok("Brand deleted successfully!");
    }

}
