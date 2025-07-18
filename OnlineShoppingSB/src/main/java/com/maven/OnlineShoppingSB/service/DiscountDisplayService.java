package com.maven.OnlineShoppingSB.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DiscountDisplayService {

    @Autowired
    private DiscountRepository discountRepository;
    @Autowired
    private DiscountProductRepository discountProductRepository;
    @Autowired
    private DiscountConditionCheckerService discountConditionCheckerService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;

    public Map<Long, List<DiscountDisplayDTO>> getProductDiscountHints(Long userId) {
        UserEntity currentUser = null;
        if (userId != null) {
            currentUser = userRepository.findById(userId).orElse(null);
            if (currentUser != null) {
                System.out.println("✅ Using user from param: " + currentUser.getEmail());
            } else {
                System.out.println("⚠ Provided userId is invalid: " + userId);
            }
        } else {
            System.out.println("👤 No userId provided — treating as public user");
        }

        // Fetch all products (replace with findActive() if needed)
        List<ProductEntity> allProducts = productRepository.findAll();
        System.out.println("📦 Found " + allProducts.size() + " products in catalog");

        Map<Long, List<DiscountDisplayDTO>> productDiscountMap = new HashMap<>();

        List<DiscountEntity> activeDiscounts = discountRepository.findByIsActiveTrueAndDelFgFalse();
        System.out.println("🎯 Found " + activeDiscounts.size() + " active discounts");

        for (DiscountEntity discount : activeDiscounts) {

            for (DiscountMechanismEntity mechanism : discount.getDiscountMechanisms()) {
                // ✅ Now process each mechanism as before
                if (mechanism == null) {
                    System.out.println("⚠ Skipped null mechanism in discount ID: " + discount.getId());
                    continue;
                }

                if (mechanism == null) {
                    System.out.println("⚠ Skipped discount with no mechanism: " + discount.getId());
                    continue;
                }
                if (!Boolean.TRUE.equals(discount.getIsActive())) {
                    System.out.println("⚠ Skipped inactive discount: " + discount.getName() + " (ID: " + discount.getId() + ")");
                    continue;
                }

                System.out.println("👉 Processing discount: " + discount.getName() + " (ID: " + discount.getId() + ")");

                // Linked products check
                // List<ProductEntity> linkedProducts = discountProductRepository.findProductsByDiscountId(discount.getId());
                List<ProductEntity> linkedProducts = discountProductRepository.findProductsByMechanismId(mechanism.getId());
                List<ProductEntity> applicableProducts = linkedProducts.isEmpty() ? allProducts : linkedProducts;

                if (linkedProducts.isEmpty()) {
                    System.out.println("🌍 No product mappings — applying globally");
                } else {
                    System.out.println("🔗 Linked to " + linkedProducts.size() + " products");
                }

                boolean eligible = discountConditionCheckerService.isEligible(currentUser, mechanism);
                System.out.println("✅ Eligibility for user: " + eligible);

                DiscountDisplayDTO dto = new DiscountDisplayDTO();
                dto.setId(discount.getId());
                dto.setName(discount.getName());
                dto.setType(discount.getType());
                dto.setCode(discount.getCode());
                dto.setShortLabel(discountConditionCheckerService.buildShortLabel(mechanism));
                dto.setConditionSummary(discountConditionCheckerService.buildConditionSummary(mechanism));
                dto.setDiscountType(mechanism.getDiscountType());
                dto.setMechanismType(mechanism.getMechanismType());
                dto.setConditionGroups(mapConditionGroups(mechanism.getDiscountConditionGroup(), currentUser));

                boolean requiresFrontendCheck = dto.getConditionGroups().stream()
                        .flatMap(group -> group.getConditions().stream())
                        .anyMatch(cond -> cond.getEligible() == null);

                dto.setRequireFrontendChecking(requiresFrontendCheck);


                // Value parsing
                if (mechanism.getValue() != null) {
                    try {
                        dto.setValue(new BigDecimal(mechanism.getValue()));
                        System.out.println("✅ Parsed discount value: " + mechanism.getValue());
                    } catch (NumberFormatException e) {
                        System.out.println("❌ Failed to parse discount value: " + mechanism.getValue());
                    }
                }

                if (mechanism.getMaxDiscountAmount() != null && !mechanism.getMaxDiscountAmount().isBlank()) {
                    try {
                        dto.setMaxDiscountAmount(new BigDecimal(mechanism.getMaxDiscountAmount()));
                        System.out.println("✅ Parsed max discount amount: " + mechanism.getMaxDiscountAmount());
                    } catch (NumberFormatException e) {
                        System.out.println("❌ Failed to parse max discount amount: " + mechanism.getMaxDiscountAmount());
                    }
                }

                // Map discount to each applicable product
                for (ProductEntity product : applicableProducts) {
                    Long productId = product.getId();
                    productDiscountMap.computeIfAbsent(productId, k -> new ArrayList<>()).add(dto);
                    System.out.println("✅ Added discount to product ID: " + productId);
                }
            }
        }

        System.out.println("🎉 Discount mapping complete. Affected products: " + productDiscountMap.size());
        return productDiscountMap;
    }

    private UserEntity getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            System.out.println("❌ No Authentication object in SecurityContext.");
            return null;
        }

        System.out.println("✅ Authentication object found: " + auth.getClass().getName());
        System.out.println("🔐 Principal: " + auth.getPrincipal());
        System.out.println("🔐 Authenticated: " + auth.isAuthenticated());

        if (auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            UserEntity user = userDetails.getUser();
            System.out.println("✅ Extracted user from CustomUserDetails: " + user.getEmail());
            return user;
        } else {
            System.out.println("❌ Principal is not instance of CustomUserDetails: " + auth.getPrincipal().getClass().getName());
        }

        return null;
    }

    public List<DiscountDisplayDTO.DiscountConditionGroupDTO> mapConditionGroups(
            List<DiscountConditionGroupEntity> groupEntities,
            UserEntity user
    ) {
        if (groupEntities == null) return new ArrayList<>();

        return groupEntities.stream().map(group -> {
            DiscountDisplayDTO.DiscountConditionGroupDTO groupDTO = new DiscountDisplayDTO.DiscountConditionGroupDTO();
            groupDTO.setLogicOperator(group.getLogicOperator());

            List<DiscountDisplayDTO.DiscountConditionDTO> conditions = group.getDiscountCondition().stream().map(condition -> {
                DiscountDisplayDTO.DiscountConditionDTO dto = new DiscountDisplayDTO.DiscountConditionDTO();
                dto.setConditionType(condition.getConditionType());
                dto.setConditionDetail(condition.getConditionDetail());
                dto.setOperator(condition.getOperator());
                dto.setValue(condition.getValue());

                Boolean passed = discountConditionCheckerService.evaluateConditionNullable(user, condition);
                dto.setEligible(passed); // can be true, false, or null for frontend evaluation

                return dto;
            }).toList();

            groupDTO.setConditions(conditions);
            return groupDTO;
        }).toList();
    }

}
