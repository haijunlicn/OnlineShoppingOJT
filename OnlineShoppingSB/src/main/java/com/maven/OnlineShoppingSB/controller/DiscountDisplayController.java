package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.service.DiscountDisplayService;
import com.maven.OnlineShoppingSB.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    @GetMapping("/can-user-use-mechanism/{mechanismId}")
    public ResponseEntity<Map<String, Object>> canUserUseDiscount(
            @PathVariable Long mechanismId,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        Long userId = principal.getUser().getId();
        DiscountUsageDTO.DiscountUsageStatus status = discountDisplayService.canUseMechanismWithReason(mechanismId, userId);

        boolean canUse = status == DiscountUsageDTO.DiscountUsageStatus.AVAILABLE;
        return ResponseEntity.ok(Map.of(
                "canUse", canUse,
                "status", status.name()
        ));
    }

}