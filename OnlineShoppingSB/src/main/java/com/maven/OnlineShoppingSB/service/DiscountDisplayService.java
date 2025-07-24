package com.maven.OnlineShoppingSB.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
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
    private CustomerGroupRepository customerGroupRepository;
    @Autowired
    private GroupRepository groupRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private BrandRepository brandRepository;
    @Autowired
    private FreeGiftRepository freeGiftRepository;
    @Autowired
    private ObjectMapper objectMapper;

    public List<DiscountEventDTO> getAllPublicActiveDiscounts(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<DiscountEntity> discounts = discountRepository.findAllActivePublicDiscounts(now);

        UserEntity resolvedUser = null;
        if (userId != null) {
            resolvedUser = userRepository.findById(userId).orElse(null);
        }
        final UserEntity userFinal = resolvedUser;  // <-- make final here

        return discounts.stream()
                .map(discount -> mapToDiscountEventDTO(discount, userFinal)) // use userFinal here
                .collect(Collectors.toList());
    }

    public Map<Long, List<DiscountDisplayDTO>> getProductDiscountHints(Long userId) {
        UserEntity currentUser = null;
        if (userId != null) {
            currentUser = userRepository.findById(userId).orElse(null);
        } else {
            // System.out.println("👤 No userId provided — treating as public user");
        }

        // Fetch all products (replace with findActive() if needed)
        List<ProductEntity> allProducts = productRepository.findAll();
        //System.out.println("📦 Found " + allProducts.size() + " products in catalog");

        Map<Long, List<DiscountDisplayDTO>> productDiscountMap = new HashMap<>();

        List<DiscountEntity> activeDiscounts = discountRepository.findByIsActiveTrueAndDelFgFalse();
        // System.out.println("🎯 Found " + activeDiscounts.size() + " active discounts");

        for (DiscountEntity discount : activeDiscounts) {

            for (DiscountMechanismEntity mechanism : discount.getDiscountMechanisms()) {
                if (mechanism == null) continue;
                if (!Boolean.TRUE.equals(discount.getIsActive())) continue;

                List<ProductEntity> linkedProducts;
                List<FreeGiftES_F> freeGiftDTOs = new ArrayList<>();

// Step 1: Handle Free Gift Mapping if applicable
                Set<Long> giftProductIds = new HashSet<>();

                if (MechanismType.freeGift.equals(mechanism.getMechanismType())) {
                    List<FreeGiftEntity> freeGifts = freeGiftRepository.findByMechanismId(mechanism.getId());

                    freeGiftDTOs = freeGifts.stream()
                            .map(fg -> {
                                FreeGiftES_F dto = new FreeGiftES_F();
                                dto.setId(fg.getId());
                                dto.setMechanismId(fg.getMechanism().getId());
                                dto.setProductId(fg.getProduct().getId());
                                dto.setProduct(ProductDTO.fromEntity(fg.getProduct())); // full product details
                                return dto;
                            }).collect(Collectors.toList());

                    giftProductIds = freeGifts.stream()
                            .map(fg -> fg.getProduct().getId())
                            .collect(Collectors.toSet());
                }

// Step 2: Extract Trigger Products from Conditions
                Set<Long> triggerProductIds = new HashSet<>();

                for (DiscountConditionGroupEntity group : mechanism.getDiscountConditionGroup()) {
                    for (DiscountConditionEntity cond : group.getDiscountCondition()) {
                        if (cond == null || !"PRODUCT".equals(cond.getConditionType().name())) continue;

                        String detail = cond.getConditionDetail();
                        List<Long> ids = extractIdsFromJson(cond.getValue());

                        switch (detail) {
                            case "product" -> triggerProductIds.addAll(ids);
                            case "category" -> {
                                List<Long> productIds = productRepository.findByCategoryIdIn(ids).stream()
                                        .map(ProductEntity::getId).toList();
                                triggerProductIds.addAll(productIds);
                            }
                            case "brand" -> {
                                List<Long> productIds = productRepository.findByBrandIdIn(ids).stream()
                                        .map(ProductEntity::getId).toList();
                                triggerProductIds.addAll(productIds);
                            }
                            default -> System.out.println("❓ Unsupported conditionDetail: " + detail);
                        }
                    }
                }

// Step 3: Include Directly Linked Discount Products (only for non-FreeGift mechanisms)
                Set<Long> directDiscountProductIds = new HashSet<>();
                if (!MechanismType.freeGift.equals(mechanism.getMechanismType())) {
                    List<ProductEntity> directProducts = discountProductRepository.findProductsByMechanismId(mechanism.getId());
                    directDiscountProductIds.addAll(directProducts.stream().map(ProductEntity::getId).toList());
                }

// Step 4: Merge all product IDs and fetch
                Set<Long> allProductIds = new HashSet<>();
                allProductIds.addAll(giftProductIds);
                allProductIds.addAll(triggerProductIds);
                allProductIds.addAll(directDiscountProductIds);

                linkedProducts = allProductIds.isEmpty()
                        ? Collections.emptyList()
                        : productRepository.findAllById(allProductIds);


                List<ProductEntity> applicableProducts = linkedProducts.isEmpty() ? allProducts : linkedProducts;

                boolean eligible = discountConditionCheckerService.isEligible(currentUser, mechanism);

                // Determine offered product IDs — only products that will receive discount
                List<Long> offeredProductIds = new ArrayList<>();

                // ✅ If mechanism is DISCOUNT or COUPON
                if (mechanism.getMechanismType() == MechanismType.Discount || mechanism.getMechanismType() == MechanismType.Coupon) {
                    // If nothing is linked, all products are affected
                    if (directDiscountProductIds.isEmpty()) {
                        offeredProductIds = allProducts.stream().map(ProductEntity::getId).toList();
                    } else {
                        offeredProductIds = new ArrayList<>(directDiscountProductIds);
                    }
                }

                // Build DiscountDisplayDTO dto as usual
                DiscountDisplayDTO dto = new DiscountDisplayDTO();
                dto.setId(discount.getId());
                dto.setName(discount.getName());
                dto.setType(discount.getType());
                dto.setCouponcode(mechanism.getCouponcode());
                dto.setShortLabel(discountConditionCheckerService.buildShortLabel(mechanism));
                dto.setConditionSummary(discountConditionCheckerService.buildConditionSummary(mechanism));
                dto.setDiscountType(mechanism.getDiscountType());
                dto.setMechanismType(mechanism.getMechanismType());
                dto.setUsageLimitTotal(mechanism.getUsageLimitTotal());
                dto.setUsageLimitPerUser(mechanism.getUsageLimitPerUser());
                dto.setConditionGroups(mapConditionGroups(mechanism.getDiscountConditionGroup(), currentUser));
                dto.setStartDate(discount.getStartDate());
                dto.setEndDate(discount.getEndDate());
                dto.setOfferedProductIds(offeredProductIds);

                if (freeGiftDTOs != null) {
                    dto.setFreeGifts(freeGiftDTOs);
                }

                boolean requiresFrontendCheck = dto.getConditionGroups().stream()
                        .flatMap(group -> group.getConditions().stream())
                        .anyMatch(cond -> cond.getEligible() == null);

                dto.setRequireFrontendChecking(requiresFrontendCheck);

                if (mechanism.getValue() != null) {
                    try {
                        dto.setValue(new BigDecimal(mechanism.getValue()));
                    } catch (NumberFormatException e) {
                    }
                }

                if (mechanism.getMaxDiscountAmount() != null && !mechanism.getMaxDiscountAmount().isBlank()) {
                    try {
                        dto.setMaxDiscountAmount(new BigDecimal(mechanism.getMaxDiscountAmount()));
                    } catch (NumberFormatException e) {
                    }
                }

                // Map discount to each applicable product
                for (ProductEntity product : applicableProducts) {
                    Long productId = product.getId();
                    productDiscountMap.computeIfAbsent(productId, k -> new ArrayList<>()).add(dto);
                }
            }
        }

        return productDiscountMap;
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
                dto.setEligible(passed);

                enrichConditionDisplay(dto);

                return dto;
            }).toList();

            groupDTO.setConditions(conditions);
            return groupDTO;
        }).toList();
    }

    public void enrichConditionDisplay(DiscountDisplayDTO.DiscountConditionDTO dto) {
        System.out.println("🧠 enrichConditionDisplay called");

        String type = dto.getConditionType().name();
        String detail = dto.getConditionDetail();

        System.out.println("type : " + type);
        System.out.println("group value " + detail);

        // ✅ Only extract IDs for those types that use IDs in value
        List<Long> ids = switch (type) {
            case "PRODUCT" -> extractIdsFromValue(dto);
            default -> List.of(); // empty for CUSTOMER_GROUP
        };

        switch (type) {
            case "PRODUCT" -> {
                if (ids.isEmpty()) return;
                switch (detail) {
                    case "product" ->
                            dto.setRelatedEntities(resolveEntities(ids, productRepository, ProductDTO::fromEntity));
                    case "brand" -> dto.setRelatedEntities(resolveEntities(ids, brandRepository, BrandDTO::fromEntity));
                    case "category" ->
                            dto.setRelatedEntities(resolveEntities(ids, categoryRepository, CategoryDTO::fromEntity));
                    default -> System.out.println("❓ Unhandled PRODUCT detail: " + detail);
                }
            }

            case "CUSTOMER_GROUP" -> {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    List<String> stringIds = mapper.readValue(dto.getValue(), new TypeReference<List<String>>() {
                    });
                    List<Long> groupIds = new ArrayList<>();
                    for (String idStr : stringIds) {
                        groupIds.add(Long.parseLong(idStr));
                    }
                    List<GroupES_G> groups = groupRepository.findAllById(groupIds)
                            .stream()
                            .map(GroupES_G::fromEntity)
                            .toList();

                    dto.setRelatedEntities(groups);
                    System.out.println("✅ Resolved groups: " + groups);
                } catch (Exception e) {
                    System.out.println("❌ Invalid CUSTOMER_GROUP IDs in value: " + dto.getValue());
                }
            }

            default -> System.out.println("❓ Unhandled condition type: " + type);
        }
    }

    private List<Long> extractIdsFromJson(String value) {
        try {
            if (value == null || value.isBlank()) return List.of();
            value = value.trim();
            ObjectMapper objectMapper = new ObjectMapper();

            if (value.startsWith("[")) {
                return objectMapper.readValue(value, new TypeReference<List<Long>>() {
                });
            } else {
                return List.of(Long.parseLong(value));
            }
        } catch (Exception e) {
            System.out.println("❌ Failed to parse condition value: " + value);
            return List.of();
        }
    }

    private List<Long> extractIdsFromValue(DiscountDisplayDTO.DiscountConditionDTO dto) {
        try {
            String raw = dto.getValue();  // <-- use getValue() instead of getConditionValue()
            if (raw == null || raw.isEmpty()) {
                return Collections.emptyList();
            }

            // Assuming raw is a JSON string representing a list or a single id
            ObjectMapper objectMapper = new ObjectMapper();

            if (raw.trim().startsWith("[")) {
                // JSON array string
                List<Long> ids = objectMapper.readValue(raw, new TypeReference<List<Long>>() {
                });
                return ids;
            } else {
                // Single id as string or number
                return List.of(Long.parseLong(raw.trim()));
            }
        } catch (Exception e) {
            System.out.println("❌ Failed to extract IDs from value: " + dto.getValue());
            return Collections.emptyList();
        }
    }

    private <T, R> List<R> resolveEntities(List<Long> ids, JpaRepository<T, Long> repo, Function<T, R> mapper) {
        return repo.findAllById(ids).stream().map(mapper).toList();
    }

    private DiscountEventDTO mapToDiscountEventDTO(DiscountEntity discount, UserEntity user) {
        DiscountEventDTO eventDTO = new DiscountEventDTO();

        eventDTO.setId(discount.getId());
        eventDTO.setName(discount.getName());
        eventDTO.setDescription(discount.getDescription());
        eventDTO.setType(discount.getType());
        eventDTO.setImgUrl(discount.getImgUrl());
        eventDTO.setStartDate(discount.getStartDate());
        eventDTO.setEndDate(discount.getEndDate());

        // Map mechanisms
        List<DiscountEventDTO.DiscountMechanismDTO> mechanismDTOs = discount.getDiscountMechanisms().stream()
                .filter(Objects::nonNull)
                .filter(m -> Boolean.TRUE.equals(discount.getIsActive()))  // active check on discount
                .map(mechanism -> mapToMechanismDTO(mechanism, user))
                .collect(Collectors.toList());

        eventDTO.setMechanisms(mechanismDTOs);

        return eventDTO;
    }

    private DiscountEventDTO.DiscountMechanismDTO mapToMechanismDTO(DiscountMechanismEntity mechanism, UserEntity user) {
        DiscountEventDTO.DiscountMechanismDTO dto = new DiscountEventDTO.DiscountMechanismDTO();

        dto.setId(mechanism.getId());
        dto.setCouponCode(mechanism.getCouponcode());

        // Value parsing
        if (mechanism.getValue() != null) {
            try {
                dto.setValue(new BigDecimal(mechanism.getValue()));
            } catch (NumberFormatException e) {
                dto.setValue(BigDecimal.ZERO);
            }
        }

        // Max discount cap
        if (mechanism.getMaxDiscountAmount() != null && !mechanism.getMaxDiscountAmount().isBlank()) {
            try {
                dto.setMaxDiscountAmount(new BigDecimal(mechanism.getMaxDiscountAmount()));
            } catch (NumberFormatException e) {
                dto.setMaxDiscountAmount(BigDecimal.ZERO);
            }
        }

        dto.setDiscountType(mechanism.getDiscountType());
        dto.setMechanismType(mechanism.getMechanismType());
        dto.setUsageLimitTotal(mechanism.getUsageLimitTotal());
        dto.setUsageLimitPerUser(mechanism.getUsageLimitPerUser());

        // Map condition groups
        List<DiscountDisplayDTO.DiscountConditionGroupDTO> conditionGroups =
                mapConditionGroups(mechanism.getDiscountConditionGroup(), user);
        dto.setConditionGroups(conditionGroups);

        // Map offered products — get from discountProducts relation
        List<ProductDTO> offeredProducts = Optional.ofNullable(mechanism.getDiscountProducts())
                .orElse(Collections.emptyList())
                .stream()
                .map(DiscountProductEntity::getProduct)
                .filter(Objects::nonNull)
                .map(ProductDTO::fromEntity)
                .collect(Collectors.toList());
        dto.setOfferedProducts(offeredProducts);

        return dto;
    }

    public DiscountEventDTO getDiscountById(Long discountId, Long userId) {
        Optional<DiscountEntity> discountOpt = discountRepository.findById(discountId.intValue());

        if (discountOpt.isEmpty()) {
            throw new RuntimeException("Discount not found for id: " + discountId);
        }

        UserEntity user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }

        return mapToDiscountEventDTO(discountOpt.get(), user);
    }


}
