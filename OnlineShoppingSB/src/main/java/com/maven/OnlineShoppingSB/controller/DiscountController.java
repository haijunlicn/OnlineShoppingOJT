package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/discounts")
public class DiscountController {
  @Autowired
private  DiscountService discountService;

  private static final Logger logger = LoggerFactory.getLogger(DiscountController.class);

 @GetMapping("/brands")
    public List<BrandDTO> getAllActiveBrands() {
        return discountService.getAllActiveBrands();
    }
 @GetMapping("/categories")
    public List<CategoryDTO> getAllActiveCategories() {
        return discountService.getAllActiveCategories();
    }

     @GetMapping("/groups")
    public List<GroupES_G> getAllGroups() {
        return discountService.getAllGroups();
    }

    @GetMapping("/groups/{id}")
    public GroupES_G getGroupById(@PathVariable Long id) {
        return discountService.getGroupById(id);
    }

    @PostMapping("/groups")
    public GroupES_G createGroup(@RequestBody GroupES_G groupDto) {
        return discountService.createGroup(groupDto);
    }

    @PutMapping("/groups/{id}")
    public GroupES_G updateGroup(@PathVariable Long id, @RequestBody GroupES_G groupDto) {
        groupDto.setId(id);
        return discountService.updateGroup(groupDto);
    }

    @DeleteMapping("/groups/{id}")
    public void deleteGroup(@PathVariable Long id) {
        discountService.deleteGroup(id);
    }
    
    @GetMapping("/products")
    public List<ProductDTO> getAllProductsForSelection() {
        return discountService.getAllProductsForSelection();
    }

   
@PostMapping("/createDiscount")
public ResponseEntity<String> createDiscount(@RequestBody DiscountES_A dto) {
    try {
        discountService.createDiscount(dto);
        return ResponseEntity.ok("success");
    } catch (Exception e) {
        // Error message ကို client ကိုပေးမယ်
        return ResponseEntity.status(500).body(e.getMessage());
    }
}

    @GetMapping("/selectallDiscount")
    public List<DiscountES_A> getAllDiscounts() {
        List<DiscountES_A> discounts = discountService.getAllDiscounts();
        for (DiscountES_A d : discounts) {
            logger.info("[getAllDiscounts] Discount {} has {} mechanisms: {}", d.getId(), d.getDiscountMechanisms() != null ? d.getDiscountMechanisms().size() : 0, d.getDiscountMechanisms() != null ? d.getDiscountMechanisms().stream().map(m -> m.getId()).toList() : "null");
        }
        return discounts;
    }

    @GetMapping("/selectdiscountbyId/{id}")
    public DiscountES_A getDiscountById(@PathVariable Integer id) {
        DiscountES_A discount = discountService.getDiscountById(id);
        logger.info("[getDiscountById] Discount {} has {} mechanisms: {}", id, discount.getDiscountMechanisms() != null ? discount.getDiscountMechanisms().size() : 0, discount.getDiscountMechanisms() != null ? discount.getDiscountMechanisms().stream().map(m -> m.getId()).toList() : "null");
        return discount;
    }

    // UPDATE: Update a discount and all its mechanisms
    @PutMapping("/updateDiscount/{id}")
    public DiscountES_A updateDiscount(@PathVariable Integer id, @RequestBody DiscountES_A dto) {
        logger.info("[updateDiscount] Incoming mechanisms: {}", dto.getDiscountMechanisms() != null ? dto.getDiscountMechanisms().stream().map(m -> m.getId()).toList() : "null");
        DiscountES_A updated = discountService.updateDiscount(id, dto);
        logger.info("[updateDiscount] After update, discount {} has {} mechanisms: {}", id, updated.getDiscountMechanisms() != null ? updated.getDiscountMechanisms().size() : 0, updated.getDiscountMechanisms() != null ? updated.getDiscountMechanisms().stream().map(m -> m.getId()).toList() : "null");
        return updated;
    }

    @DeleteMapping("/deleteDisount/{id}")
    public void deleteDiscount(@PathVariable Integer id) {
        discountService.deleteDiscount(id);
    }

   @PatchMapping("/updateDiscountStatus/{id}")
public ResponseEntity<?> updateDiscountStatus(@PathVariable Integer id, @RequestBody Map<String, Boolean> body) {
    Boolean isActive = body.get("isActive");
    discountService.updateDiscountStatus(id, isActive);
    // return ResponseEntity.ok("success"); // ဒီလိုမပေးပါနဲ့
    Map<String, Object> resp = new HashMap<>();
    resp.put("success", true);
    return ResponseEntity.ok(resp); // JSON object format
}

  @PostMapping("/groups/{groupId}/conditions")
    public ResponseEntity<?> saveGroupConditions(
            @PathVariable Long groupId,
            @RequestBody GroupES_G groupDto) {
        discountService.saveGroupConditions(groupId, groupDto.getDiscountConditionGroups());
        return ResponseEntity.ok("success");
    }
    
    // Get all condition groups for a group
@GetMapping("/groups/{groupId}/conditions")
public List<DiscountConditionGroupES_C> getGroupConditions(@PathVariable Long groupId) {
    return discountService.getGroupConditions(groupId);
}

// Delete a condition group by id (and cascade delete its conditions)
@DeleteMapping("/conditionGroups/{conditionGroupId}")
public ResponseEntity<?> deleteConditionGroup(@PathVariable Integer conditionGroupId) {
    discountService.deleteConditionGroup(conditionGroupId);
    return ResponseEntity.ok("Deleted");
}
}

