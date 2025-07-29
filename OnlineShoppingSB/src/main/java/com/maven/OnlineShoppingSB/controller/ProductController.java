package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.CreateProductRequestDTO;
import com.maven.OnlineShoppingSB.dto.ProductDTO;
import com.maven.OnlineShoppingSB.dto.ProductListItemDTO;
import com.maven.OnlineShoppingSB.dto.StockUpdateRequestDTO;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.service.ExcelTemplateService;
import com.maven.OnlineShoppingSB.service.ProductService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> createProduct(
            @RequestBody CreateProductRequestDTO requestDTO,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest request) {
        try {
            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.createProduct(requestDTO, currentUser, request);
            return ResponseEntity.ok("Product created successfully!");
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to create product.");
        } catch (RuntimeException ex) {
            System.err.println("RuntimeException in createProduct: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    ex.getMessage() != null ? ex.getMessage() : "Unknown error occurred."
            );
        } catch (Exception ex) {
            System.err.println("Exception in createProduct: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred.");
        }
    }

    @PutMapping("/update")
    @PreAuthorize("hasAuthority('PRODUCT_UPDATE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> updateProduct(
            @RequestBody CreateProductRequestDTO requestDTO,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest request) {
        try {
            System.out.println("UpdateProduct called by user: " + (principal != null ? principal.getUsername() : "anonymous"));
            System.out.println("Request DTO: " + requestDTO);

            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.updateProduct(requestDTO, currentUser, request);

            System.out.println("Product updated successfully!");
            return ResponseEntity.ok("Product updated successfully!");
        } catch (AccessDeniedException ex) {
            System.out.println("AccessDeniedException: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to update the product.");
        } catch (RuntimeException ex) {
            System.out.println("RuntimeException: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        } catch (Exception ex) {
            System.out.println("Exception: " + ex.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred during update.");
        }
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('PRODUCT_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<ProductListItemDTO>> getAllProducts() {
        List<ProductListItemDTO> dtos = productService.getAllProducts();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PRODUCT_READ') or hasRole('SUPERADMIN')")
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

    @GetMapping("/public-list")
    public ResponseEntity<List<ProductListItemDTO>> getPublicProductList() {
        List<ProductListItemDTO> dtos = productService.getAllPublicProducts();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<ProductListItemDTO> getPublicProductById(@PathVariable Long id) {
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
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('SUPERADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() throws IOException {
        ByteArrayInputStream stream = excelService.generateProductUploadTemplate();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=product_upload_template.xlsx")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(stream.readAllBytes());
    }

    @PostMapping("/upload-zip")
    @PreAuthorize("hasAuthority('PRODUCT_CREATE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> uploadZip(
            @RequestParam("zipFile") MultipartFile zipFile,
            @AuthenticationPrincipal CustomUserDetails principal,
            HttpServletRequest request
    ) {
        try {
            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.processZipFile(zipFile, currentUser, request);
            return ResponseEntity.ok("Upload and processing successful!");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Upload failed: " + ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unexpected error occurred");
        }
    }

    @GetMapping("/related")
    // @PreAuthorize("hasAuthority('PRODUCT_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<ProductDTO>> getRelatedProducts(
            @RequestParam Long categoryId,
            @RequestParam Long productId) {
        return ResponseEntity.ok(productService.getRelatedProducts(categoryId, productId));
    }

    @PutMapping("/update-stock")
    @PreAuthorize("hasAuthority('PRODUCT_STOCK_UPDATE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> updateStock(
            @RequestBody StockUpdateRequestDTO request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        try {
            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.updateStock(request, currentUser);
            return ResponseEntity.ok("Stock updated successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{productId}/soft-delete")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> softDeleteProduct(
            @PathVariable Long productId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        try {
            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.softDeleteProduct(productId, currentUser);
            return ResponseEntity.ok("Product soft-deleted successfully.");
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete product.");
        }
    }

    @PutMapping("/variants/{variantId}/soft-delete")
    @PreAuthorize("hasAuthority('PRODUCT_DELETE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> softDeleteVariant(
            @PathVariable Long variantId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        try {
            UserEntity currentUser = principal != null ? principal.getUser() : null;
            productService.softDeleteVariant(variantId, currentUser);
            return ResponseEntity.ok("Variant soft-deleted successfully.");
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Variant not found.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete variant.");
        }
    }

}
