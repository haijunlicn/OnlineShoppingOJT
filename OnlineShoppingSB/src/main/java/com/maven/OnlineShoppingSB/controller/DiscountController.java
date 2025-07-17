package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.service.DiscountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discounts")
public class DiscountController {
  @Autowired
private  DiscountService discountService;

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

    // //for main
    // @PostMapping("/createDiscount")
    // public DiscountES_A createDiscount(@RequestBody DiscountES_A dto) {
    //     return discountService.createDiscount(dto);
    // }

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
        return discountService.getAllDiscounts();
    }

    @GetMapping("/selectdiscountbyId/{id}")
    public DiscountES_A getDiscountById(@PathVariable Integer id) {
        return discountService.getDiscountById(id);
    }

    @PutMapping("/updateDiscount/{id}")
    public DiscountES_A updateDiscount(@PathVariable Integer id, @RequestBody DiscountES_A dto) {
        return discountService.updateDiscount(id, dto);
    }

    @DeleteMapping("/deleteDisount/{id}")
    public void deleteDiscount(@PathVariable Integer id) {
        discountService.deleteDiscount(id);
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

