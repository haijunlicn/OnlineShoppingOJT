package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.BrandDTO;
import com.maven.OnlineShoppingSB.service.BrandService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/brand")
public class BrandController {

    @Autowired
    private BrandService brandService;

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('BRAND_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> updateBrand(@RequestBody BrandDTO dto) {
        try {
            brandService.updateBrand(dto);
            return ResponseEntity.ok("Brand updated successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('BRAND_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> insertBrand(@RequestBody BrandDTO dto) {
        try {
            brandService.insertBrand(dto);
            return ResponseEntity.ok("Brand creat=ed successfully!");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

//    @PostMapping("/create")
//    @PreAuthorize("hasAuthority('BRAND_MANAGE') or hasRole('SUPERADMIN')")
//    public ResponseEntity<String> insertBrand(@RequestBody BrandDTO dto) {
//        brandService.insertBrand(dto);
//        return ResponseEntity.ok("Brand created successfully!");
//    }
//
//    @PutMapping("/update/{id}")
//    @PreAuthorize("hasAuthority('BRAND_MANAGE') or hasRole('SUPERADMIN')")
//    public ResponseEntity<String> updateBrand(@RequestBody BrandDTO dto) {
//        brandService.updateBrand(dto);
//        return ResponseEntity.ok("Brand updated successfully!");
//    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('BRAND_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<BrandDTO>> getAllBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @GetMapping("/public/list")
    public ResponseEntity<List<BrandDTO>> getAllPublicBrands() {
        return ResponseEntity.ok(brandService.getAllBrands());
    }

    @GetMapping("/getbyid/{id}")
    @PreAuthorize("hasAuthority('BRAND_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<BrandDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(brandService.getById(id));
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('BRAND_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> deleteBrand(@PathVariable Long id) {
        brandService.deleteBrand(id);
        return ResponseEntity.ok("Brand deleted successfully!");
    }

}
