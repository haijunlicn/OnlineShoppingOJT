package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.CreateProductRequestDTO;
import com.maven.OnlineShoppingSB.dto.ProductDTO;
import com.maven.OnlineShoppingSB.dto.ProductListItemDTO;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.service.ProductService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;


    // POST /products - create new product with options and variants
    @PostMapping("/create")
    public ResponseEntity<String> createProduct(@RequestBody CreateProductRequestDTO requestDTO) {
        try {
            productService.createProduct(requestDTO);
            return ResponseEntity.ok("Product created successfully!");
        } catch (AccessDeniedException ex) {
            // 403 Forbidden
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to create product.");
        } catch (RuntimeException ex) {
            // 400 Bad Request
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (Exception ex) {
            // 500 Internal Server Error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred.");
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<ProductListItemDTO>> getAllProducts() {
        System.out.println("hello");
        List<ProductListItemDTO> dtos = productService.getAllProducts();
        System.out.println("product list : " + dtos);
        return ResponseEntity.ok(dtos);
    }

}
