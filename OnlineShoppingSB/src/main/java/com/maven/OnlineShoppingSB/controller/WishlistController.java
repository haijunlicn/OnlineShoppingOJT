// === WishlistController.java ===
package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.WishlistDTO;
import com.maven.OnlineShoppingSB.dto.WishlistTitleDTO;
import com.maven.OnlineShoppingSB.entity.WishlistEntity;
import com.maven.OnlineShoppingSB.entity.WishlistTitleEntity;
import com.maven.OnlineShoppingSB.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "http://localhost:4200")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @PostMapping("/title")
    public ResponseEntity<WishlistTitleEntity> createWishlistTitle(@RequestBody WishlistTitleDTO dto) {
        WishlistTitleEntity createdTitle = wishlistService.createWishlistTitle(dto);
        return ResponseEntity.ok(createdTitle);
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, String>> addWish(@RequestBody WishlistDTO dto) {
        wishlistService.addToWishlist(dto);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Product added to wishlist");
        return ResponseEntity.ok(response);
    }

//    @GetMapping("/titles/{userId}")
//    public ResponseEntity<?> getTitlesByUser(@PathVariable Long userId) {
//        try {
//            List<WishlistTitleEntity> titles = wishlistService.getTitlesByUser(userId);
//            System.out.println("wishlist titles : " + titles);
//            return ResponseEntity.ok(titles);
//        } catch (Exception e) {
//            e.printStackTrace();
//            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                    .body("Failed to fetch wishlist titles: " + e.getMessage());
//        }
//    }

    @GetMapping("/titles/{userId}")
    public ResponseEntity<?> getTitlesByUser(@PathVariable Long userId) {
        try {
            List<WishlistTitleDTO> titles = wishlistService.getTitlesByUser(userId);
            System.out.println("wishlist titles : " + titles);
            return ResponseEntity.ok(titles);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch wishlist titles: " + e.getMessage());
        }
    }



    @GetMapping("/items/{titleId}")
    public ResponseEntity<List<WishlistDTO>> getProductsByWishlistTitle(@PathVariable Long titleId) {
        List<WishlistDTO> products = wishlistService.getProductsByWishlistTitle(titleId);
        System.out.println("wishlist products : " + products);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/wished-products/{userId}")
    public ResponseEntity<List<Long>> getWishedProductIds(@PathVariable Long userId) {
        List<Long> ids = wishlistService.getWishedProductIdsByUser(userId);
        return ResponseEntity.ok(ids);
    }

    @DeleteMapping("/remove")
    public ResponseEntity<?> removeProductFromWishlist(
            @RequestParam Long userId,
            @RequestParam Long productId) {
        try {
            wishlistService.removeByUserIdAndProductId(userId, productId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to remove wishlist item: " + e.getMessage());
        }
    }
    @DeleteMapping("/remove-from-title")
    public ResponseEntity<?> removeFromSpecificTitle(
            @RequestParam Long userId,
            @RequestParam Long titleId,
            @RequestParam Long productId) {
        try {
            wishlistService.removeFromSpecificTitle(userId, titleId, productId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error removing item: " + e.getMessage());
        }
    }
    @DeleteMapping("/title/{titleId}")
    public ResponseEntity<Void> deleteWishlistTitle(@PathVariable Long titleId) {
        wishlistService.deleteWishlistTitle(titleId);
        return ResponseEntity.noContent().build();
    }

}