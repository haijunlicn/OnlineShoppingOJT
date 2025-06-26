package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.CreateProductRequestDTO;
import com.maven.OnlineShoppingSB.dto.ProductDTO;
import com.maven.OnlineShoppingSB.dto.ProductListItemDTO;
import com.maven.OnlineShoppingSB.dto.StockUpdateRequestDTO;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.service.ExcelTemplateService;
import com.maven.OnlineShoppingSB.service.ProductService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ExcelTemplateService excelService;

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

    @PutMapping("/update")
    public ResponseEntity<String> updateProduct(@RequestBody CreateProductRequestDTO requestDTO) {
        try {
            productService.updateProduct(requestDTO);
            return ResponseEntity.ok("Product updated successfully!");
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to update the product.");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during update.");
        }
    }


    @GetMapping("/list")
    public ResponseEntity<List<ProductListItemDTO>> getAllProducts() {
        List<ProductListItemDTO> dtos = productService.getAllProducts();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductListItemDTO> getProductById(@PathVariable Long id) {
        try {
            ProductListItemDTO productDTO = productService.getProductById(id);
            return ResponseEntity.ok(productDTO);
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/bulk-upload-template")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        ByteArrayInputStream stream = excelService.generateProductUploadTemplate();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=product_upload_template.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(stream.readAllBytes());
    }

    @PostMapping("/upload-zip")
    public ResponseEntity<String> uploadZip(@RequestParam("zipFile") MultipartFile zipFile) {
        try {
            productService.processZipFile(zipFile);
            return ResponseEntity.ok("Upload and processing successful!");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Upload failed: " + ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error occurred");
        }
    }
    @GetMapping("/related")
    public ResponseEntity<List<ProductDTO>> getRelatedProducts(
            @RequestParam Long categoryId,
            @RequestParam Long productId) {
        return ResponseEntity.ok(productService.getRelatedProducts(categoryId, productId));
    }

    @PutMapping("/update-stock")
    public ResponseEntity<String> updateStock(@RequestBody StockUpdateRequestDTO request) {
        try {
            productService.updateStock(request);
            return ResponseEntity.ok("Stock updated successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

}
