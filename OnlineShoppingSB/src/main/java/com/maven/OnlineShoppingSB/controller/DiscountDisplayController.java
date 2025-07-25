package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.service.DiscountDisplayService;
import com.maven.OnlineShoppingSB.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/discountDisplay")
public class DiscountDisplayController {

    private final DiscountDisplayService discountDisplayService;

    public DiscountDisplayController(DiscountDisplayService discountDisplayService) {
        this.discountDisplayService = discountDisplayService;
    }

    @GetMapping("/public/product-hints")
    public ResponseEntity<Map<Long, List<DiscountDisplayDTO>>> getProductDiscountHints(
            @RequestParam(required = false) Long userId) {

        Map<Long, List<DiscountDisplayDTO>> hints = discountDisplayService.getProductDiscountHints(userId);

        // System.out.println("hint logs : " + hints);

        return ResponseEntity.ok(hints);
    }

    @GetMapping("/public/active-discounts")
    public ResponseEntity<List<DiscountEventDTO>> getActiveDiscounts(
            @RequestParam(required = false) Long userId) {

        List<DiscountEventDTO> discounts = discountDisplayService.getAllPublicActiveDiscounts(userId);
        return ResponseEntity.ok(discounts);
    }

    @GetMapping("/public/discount/{id}")
    public DiscountEventDTO getDiscountById(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return discountDisplayService.getDiscountById(id, userId);
    }

}