package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.CreateProductRequestDTO;
import com.maven.OnlineShoppingSB.service.ProductService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    // POST /products - create new product with options and variants
    @PostMapping
    public ResponseEntity<String> createProduct(@RequestBody CreateProductRequestDTO requestDTO) {

        System.out.println("create req dto : " + requestDTO);

        productService.createProduct(requestDTO);
        return ResponseEntity.ok("Product created successfully!");
    }

}
