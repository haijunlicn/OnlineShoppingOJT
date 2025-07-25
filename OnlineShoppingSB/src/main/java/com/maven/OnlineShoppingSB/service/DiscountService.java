package com.maven.OnlineShoppingSB.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DiscountService {

    @Autowired
    private BrandRepository brandRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ProductVariantRepository productVariantRepository;
    @Autowired
    private ProductImageRepository productImageRepository;


    public List<BrandDTO> getAllActiveBrands() {
        List<BrandEntity> brands = brandRepository.findByDelFg(1);
        return brands.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private BrandDTO toDTO(BrandEntity entity) {
        BrandDTO dto = new BrandDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setLogo(entity.getLogo());
        return dto;
    }


    public List<CategoryDTO> getAllActiveCategories() {
        List<CategoryEntity> categories = categoryRepository.findByDelFg(1);
        return categories.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private CategoryDTO toDTO(CategoryEntity entity) {
        CategoryDTO dto = new CategoryDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setImgPath(entity.getImgPath());
        dto.setParentCategoryId(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
        return dto;
    }

    public List<GroupES_G> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::toGroupDto)
                .collect(Collectors.toList());
    }

    public GroupES_G getGroupById(Long id) {
        return groupRepository.findById(id)
                .map(this::toGroupDto)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public GroupES_G createGroup(GroupES_G groupDto) {
        GroupEntity entity = toGroupEntity(groupDto);
        entity.setId(null); // Let JPA generate ID
        GroupEntity saved = groupRepository.save(entity);
        return toGroupDto(saved);
    }

    public GroupES_G updateGroup(GroupES_G groupDto) {
        GroupEntity entity = groupRepository.findById(groupDto.getId())
                .orElseThrow(() -> new RuntimeException("Group not found"));
        entity.setName(groupDto.getName());
        entity.setUpdateDate(groupDto.getUpdateDate());
        // update other fields as needed
        GroupEntity saved = groupRepository.save(entity);
        return toGroupDto(saved);
    }

    public void deleteGroup(long id) {
        groupRepository.deleteById(id);
    }

    // Mapping methods
    private GroupES_G toGroupDto(GroupEntity entity) {
        GroupES_G dto = new GroupES_G();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCreateDate(entity.getCreateDate());
        dto.setUpdateDate(entity.getUpdateDate());
        // dto.setCustomerGroup(...); // map as needed
        // dto.setDiscountConditionGroups(...);
        return dto;
    }

    private GroupEntity toGroupEntity(GroupES_G dto) {
        GroupEntity entity = new GroupEntity();
        entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setCreateDate(dto.getCreateDate());
        entity.setUpdateDate(dto.getUpdateDate());
        // entity.setCustomerGroup(...); // map as needed
        // entity.setDiscountConditionGroups(...);
        return entity;
    }

    public List<ProductDTO> getAllProductsForSelection() {
        List<ProductEntity> products = productRepository.findAll();
        List<ProductDTO> productDTOs = new ArrayList<>();
        for (ProductEntity product : products) {
            ProductDTO dto = new ProductDTO();
            dto.setId(product.getId());
            dto.setName(product.getName());
            dto.setDescription(product.getDescription());
            dto.setBasePrice(product.getBasePrice());
            dto.setCreatedDate(product.getCreatedDate());

            // Brand
            if (product.getBrand() != null) {
                BrandDTO brandDTO = new BrandDTO();
                brandDTO.setId(product.getBrand().getId());
                brandDTO.setName(product.getBrand().getName());
                dto.setBrand(brandDTO);
            }

            // Category
            if (product.getCategory() != null) {
                CategoryDTO categoryDTO = new CategoryDTO();
                categoryDTO.setId(product.getCategory().getId());
                categoryDTO.setName(product.getCategory().getName());
                dto.setCategory(categoryDTO);
            }

            // Product Variants (for stock)
            List<ProductVariantDTO> variantDTOs = productVariantRepository.findByProductId(product.getId())
                    .stream()
                    .map(variant -> {
                        ProductVariantDTO vdto = new ProductVariantDTO();
                        vdto.setId(variant.getId());
                        vdto.setStock(variant.getStock());
                        vdto.setSku(variant.getSku());
                        return vdto;
                    }).collect(Collectors.toList());
            dto.setProductVariants(variantDTOs);

            // Product Images (for main image)
            List<ProductImageDTO> imageDTOs = productImageRepository.findAll()
                    .stream()
                    .filter(img -> img.getProduct().getId().equals(product.getId()) && img.isMainImageStatus())
                    .map(img -> {
                        ProductImageDTO productImagedto = new ProductImageDTO();
                        productImagedto.setId(img.getId());
                        productImagedto.setProductId(product.getId());
                        productImagedto.setImgPath(img.getImgPath());
                        productImagedto.setMainImageStatus(img.isMainImageStatus());
                        return productImagedto;
                    }).collect(Collectors.toList());
            dto.setProductImages(imageDTOs);

            productDTOs.add(dto);
        }
        return productDTOs;
    }


    /// /////for main
    @Autowired
    private DiscountRepository discountRepository;
    @Autowired
    private DiscountMechanismRepository mechanismRepository;
    @Autowired
    private DiscountConditionGroupRepository conditionGroupRepository;
    @Autowired
    private DiscountConditionRepository conditionRepository;
    @Autowired
    private DiscountProductRepository discountProductRepository;
    @Autowired
    private FreeGiftRepository freeGiftRepository;

    // CREATE
    public DiscountES_A createDiscount(DiscountES_A dto) {
        DiscountEntity entity = mapToEntity(dto, true);
        DiscountEntity saved = discountRepository.save(entity);
        return mapToDto(saved, true);
    }

    public List<DiscountES_A> getAllDiscounts() {
        return discountRepository.findAll().stream()
                .map(e -> mapToDto(e, true)) // <-- withChildren = true
                .collect(Collectors.toList());
    }

    // READ BY ID
    public DiscountES_A getDiscountById(Integer id) {
        DiscountEntity entity = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        return mapToDto(entity, true);
    }

    // UPDATE
    public DiscountES_A updateDiscount(Integer id, DiscountES_A dto) {
        DiscountEntity entity = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));

        // Update simple fields
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setCode(dto.getCode());
        entity.setDescription(dto.getDescription());
        entity.setDelFg(dto.getDelFg());
        entity.setCreatedDate(dto.getCreatedDate());
        entity.setEndDate(dto.getEndDate());
        entity.setImgUrl(dto.getImgUrl());
        entity.setIsActive(dto.getIsActive());
        entity.setCurrentRedemptionCount(dto.getCurrentRedemptionCount());

        // --- Handle children: Mechanisms ---
        // 1. Remove old mechanisms (and cascade children)
        if (entity.getDiscountMechanisms() != null) {
            entity.getDiscountMechanisms().clear();
        }

        // 2. Add new mechanisms from DTO (with children)
        if (dto.getDiscountMechanisms() != null) {
            List<DiscountMechanismEntity> mechanismEntities = new ArrayList<>();
            for (DiscountMechanismES_B mechDto : dto.getDiscountMechanisms()) {
                DiscountMechanismEntity mechEntity = new DiscountMechanismEntity();
                mechEntity.setMechanismType(mechDto.getMechanismType());
                mechEntity.setQuantity(mechDto.getQuantity());
                mechEntity.setServiceDiscount(mechDto.getServiceDiscount());
                mechEntity.setDiscountType(mechDto.getDiscountType());
                mechEntity.setValue(mechDto.getValue());
                mechEntity.setMaxDiscountAmount(mechDto.getMaxDiscountAmount());
                mechEntity.setCouponcode(mechDto.getCouponcode()); // Add Couponcode field
                mechEntity.setDelFg(mechDto.getDelFg());
                mechEntity.setCreatedDate(mechDto.getCreatedDate());
                mechEntity.setUpdatedDate(mechDto.getUpdatedDate());
                mechEntity.setDiscount(entity); // set parent

                // --- Discount Products ---
                if (mechDto.getDiscountProducts() != null) {
                    List<DiscountProductEntity> productEntities = new ArrayList<>();
                    for (DiscountProductES_E prodDto : mechDto.getDiscountProducts()) {
                        DiscountProductEntity prodEntity = new DiscountProductEntity();
                        ProductEntity product = productRepository.findById(prodDto.getProductId())
                                .orElseThrow(() -> new RuntimeException("Product not found: " + prodDto.getProductId()));
                        prodEntity.setProduct(product);
                        prodEntity.setDiscountMechanism(mechEntity);
                        productEntities.add(prodEntity);
                    }
                    mechEntity.setDiscountProducts(productEntities);
                }

                // --- Free Gifts ---
                if (mechDto.getFreeGifts() != null) {
                    List<FreeGiftEntity> giftEntities = new ArrayList<>();
                    for (FreeGiftES_F giftDto : mechDto.getFreeGifts()) {
                        FreeGiftEntity giftEntity = new FreeGiftEntity();
                        ProductEntity product = productRepository.findById(giftDto.getProductId())
                                .orElseThrow(() -> new RuntimeException("Product not found: " + giftDto.getProductId()));
                        giftEntity.setProduct(product);
                        giftEntity.setMechanism(mechEntity);
                        giftEntities.add(giftEntity);
                    }
                    mechEntity.setFreeGifts(giftEntities);
                }

                // --- Condition Groups ---
                if (mechDto.getDiscountConditionGroup() != null) {
                    List<DiscountConditionGroupEntity> groupEntities = new ArrayList<>();
                    for (DiscountConditionGroupES_C groupDto : mechDto.getDiscountConditionGroup()) {
                        DiscountConditionGroupEntity groupEntity = new DiscountConditionGroupEntity();
                        groupEntity.setLogicOperator(groupDto.getLogicOperator());
                        groupEntity.setDiscountMechanism(mechEntity);

                        // --- Conditions ---
                        if (groupDto.getDiscountCondition() != null) {
                            List<DiscountConditionEntity> condEntities = new ArrayList<>();
                            for (DiscountConditionES_D condDto : groupDto.getDiscountCondition()) {
                                DiscountConditionEntity condEntity = new DiscountConditionEntity();
                                condEntity.setConditionType(condDto.getConditionType());
                                condEntity.setConditionDetail(condDto.getConditionDetail());
                                condEntity.setDelFg(condDto.getDelFg());
                                condEntity.setCreatedDate(condDto.getCreatedDate());
                                condEntity.setUpdatedDate(condDto.getUpdatedDate());
                                condEntity.setOperator(condDto.getOperator());
                                try {
                                    ObjectMapper mapper = new ObjectMapper();
                                    condEntity.setValue(mapper.writeValueAsString(condDto.getValue())); // String[] → JSON string
                                } catch (Exception e) {
                                    condEntity.setValue("[]"); // fallback to empty array
                                }
                                condEntity.setDiscountConditionGroup(groupEntity);
                                condEntities.add(condEntity);
                            }
                            groupEntity.setDiscountCondition(condEntities);
                        }
                        groupEntities.add(groupEntity);
                    }
                    mechEntity.setDiscountConditionGroup(groupEntities);
                }
                mechanismEntities.add(mechEntity);
            }
            entity.setDiscountMechanisms(mechanismEntities);
        }

        // Save and return DTO
        DiscountEntity saved = discountRepository.save(entity);
        return mapToDto(saved, true);
    }

    public void updateDiscountStatus(Integer id, Boolean isActive) {
        DiscountEntity entity = discountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Not found"));
        entity.setIsActive(isActive);
        discountRepository.save(entity);
    }


    // DELETE
    public void deleteDiscount(Integer id) {
        discountRepository.deleteById(id);
    }

    // --- Mapping Methods (DTO <-> Entity) ---
    private DiscountEntity mapToEntity(DiscountES_A dto, boolean withChildren) {
        if (dto == null) return null;

        DiscountEntity entity = new DiscountEntity();
        // entity.setId(dto.getId());
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setDescription(dto.getDescription());
        entity.setCode(dto.getCode());
        entity.setCurrentRedemptionCount(dto.getCurrentRedemptionCount());
        entity.setImgUrl(dto.getImgUrl());
        entity.setStartDate(dto.getStartDate());
        entity.setEndDate(dto.getEndDate());
        entity.setIsActive(dto.getIsActive());
        entity.setDelFg(dto.getDelFg());
        entity.setCreatedDate(LocalDateTime.now());
        entity.setUpdatedDate(LocalDateTime.now());

        if (withChildren && dto.getDiscountMechanisms() != null) {
            List<DiscountMechanismEntity> mechanismEntities = new ArrayList<>();
            for (DiscountMechanismES_B mechDto : dto.getDiscountMechanisms()) {
                DiscountMechanismEntity mechEntity = new DiscountMechanismEntity();
                // mechEntity.setId(mechDto.getId());
                mechEntity.setMechanismType(mechDto.getMechanismType());
                mechEntity.setQuantity(mechDto.getQuantity());
                mechEntity.setServiceDiscount(mechDto.getServiceDiscount());
                mechEntity.setDiscountType(mechDto.getDiscountType());
                mechEntity.setValue(mechDto.getValue());
                mechEntity.setMaxDiscountAmount(mechDto.getMaxDiscountAmount());
                mechEntity.setCouponcode(mechDto.getCouponcode()); // Add Couponcode field
                mechEntity.setDelFg(mechDto.getDelFg());
                mechEntity.setCreatedDate(LocalDateTime.now());
                mechEntity.setUpdatedDate(LocalDateTime.now());
                mechEntity.setDiscount(entity); // set parent
                mechEntity.setUsageLimitTotal(mechDto.getUsageLimitTotal());
                mechEntity.setUsageLimitPerUser(mechDto.getUsageLimitPerUser());

                // --- Discount Products ---
                if (mechDto.getDiscountProducts() != null) {
                    List<DiscountProductEntity> productEntities = new ArrayList<>();
                    for (DiscountProductES_E prodDto : mechDto.getDiscountProducts()) {
                        DiscountProductEntity prodEntity = new DiscountProductEntity();
                        // prodEntity.setId(prodDto.getId());
                        ProductEntity product = productRepository.findById(prodDto.getProductId())
                                .orElseThrow(() -> new RuntimeException("Product not found: " + prodDto.getProductId()));
                        prodEntity.setProduct(product);
                        prodEntity.setDiscountMechanism(mechEntity);
                        productEntities.add(prodEntity);
                    }
                    mechEntity.setDiscountProducts(productEntities);
                }

                // --- Free Gifts ---
                if (mechDto.getFreeGifts() != null) {
                    List<FreeGiftEntity> giftEntities = new ArrayList<>();
                    for (FreeGiftES_F giftDto : mechDto.getFreeGifts()) {
                        FreeGiftEntity giftEntity = new FreeGiftEntity();
                        // giftEntity.setId(giftDto.getId());
                        ProductEntity product = productRepository.findById(giftDto.getProductId())
                                .orElseThrow(() -> new RuntimeException("Product not found: " + giftDto.getProductId()));
                        giftEntity.setProduct(product);
                        giftEntity.setMechanism(mechEntity);
                        giftEntities.add(giftEntity);
                    }
                    mechEntity.setFreeGifts(giftEntities);
                }

                // --- Condition Groups ---
                if (mechDto.getDiscountConditionGroup() != null) {
                    List<DiscountConditionGroupEntity> groupEntities = new ArrayList<>();
                    for (DiscountConditionGroupES_C groupDto : mechDto.getDiscountConditionGroup()) {
                        DiscountConditionGroupEntity groupEntity = new DiscountConditionGroupEntity();
                        // groupEntity.setId(groupDto.getId());
                        // groupEntity.setLogicOperator(groupDto.getLogicOperator());
                        groupEntity.setLogicOperator(parseLogicOperator(mechDto.getLogicOperator()));
                        groupEntity.setDiscountMechanism(mechEntity);

                        // --- Conditions ---
                        if (groupDto.getDiscountCondition() != null) {
                            List<DiscountConditionEntity> condEntities = new ArrayList<>();
                            for (DiscountConditionES_D condDto : groupDto.getDiscountCondition()) {
                                DiscountConditionEntity condEntity = new DiscountConditionEntity();
                                // condEntity.setId(condDto.getId());
                                condEntity.setConditionType(condDto.getConditionType());
                                condEntity.setConditionDetail(condDto.getConditionDetail());
                                condEntity.setDelFg(condDto.getDelFg());
                                condEntity.setCreatedDate(condDto.getCreatedDate());
                                condEntity.setUpdatedDate(condDto.getUpdatedDate());
                                condEntity.setOperator(condDto.getOperator());
                                try {
                                    ObjectMapper mapper = new ObjectMapper();

                                    Object rawValue = condDto.getValue();
                                    List<Object> normalized = new ArrayList<>();

                                    if (rawValue instanceof String[]) {
                                        // flatten strings by splitting commas, then convert to numbers or booleans if possible
                                        for (String s : (String[]) rawValue) {
                                            for (String part : s.split(",")) {
                                                String trimmed = part.trim();
                                                // try to parse numbers or booleans, else keep string
                                                if (trimmed.matches("-?\\d+")) {
                                                    normalized.add(Integer.parseInt(trimmed));
                                                } else if (trimmed.equalsIgnoreCase("true") || trimmed.equalsIgnoreCase("false")) {
                                                    normalized.add(Boolean.parseBoolean(trimmed));
                                                } else {
                                                    normalized.add(trimmed);
                                                }
                                            }
                                        }
                                    } else if (rawValue instanceof List) {
                                        // You can do similar parsing for List<String>
                                        List<?> list = (List<?>) rawValue;
                                        for (Object val : list) {
                                            String s = val.toString().trim();
                                            if (s.matches("-?\\d+")) {
                                                normalized.add(Integer.parseInt(s));
                                            } else if (s.equalsIgnoreCase("true") || s.equalsIgnoreCase("false")) {
                                                normalized.add(Boolean.parseBoolean(s));
                                            } else {
                                                normalized.add(s);
                                            }
                                        }
                                    } else {
                                        // fallback: just put rawValue as string
                                        normalized.add(rawValue);
                                    }

// Now serialize normalized list as JSON array with numbers or booleans unquoted
                                    condEntity.setValue(mapper.writeValueAsString(normalized));


                                    // Always serialize String[] to JSON string
                                    // condEntity.setValue(mapper.writeValueAsString(condDto.getValue()));
                                } catch (Exception e) {
                                    condEntity.setValue("[]"); // fallback to empty array
                                }
                                condEntity.setDiscountConditionGroup(groupEntity);
                                condEntities.add(condEntity);
                            }
                            groupEntity.setDiscountCondition(condEntities);
                        }
                        groupEntities.add(groupEntity);
                    }
                    mechEntity.setDiscountConditionGroup(groupEntities);
                }
                mechanismEntities.add(mechEntity);
            }
            entity.setDiscountMechanisms(mechanismEntities);
        }
        return entity;
    }

    private DiscountES_A mapToDto(DiscountEntity entity, boolean withChildren) {
        if (entity == null) return null;

        DiscountES_A dto = new DiscountES_A();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setDescription(entity.getDescription());
        dto.setCode(entity.getCode());
        dto.setCurrentRedemptionCount(entity.getCurrentRedemptionCount());
        dto.setImgUrl(entity.getImgUrl());
        dto.setStartDate(entity.getStartDate());
        dto.setEndDate(entity.getEndDate());
        dto.setIsActive(entity.getIsActive());
        dto.setDelFg(entity.getDelFg());
        dto.setCreatedDate(LocalDateTime.now());
        dto.setUpdatedDate(LocalDateTime.now());

        if (withChildren && entity.getDiscountMechanisms() != null) {
            List<DiscountMechanismES_B> mechanismDtos = new ArrayList<>();
            for (DiscountMechanismEntity mechEntity : entity.getDiscountMechanisms()) {
                DiscountMechanismES_B mechDto = new DiscountMechanismES_B();
                mechDto.setId(mechEntity.getId());
                mechDto.setMechanismType(mechEntity.getMechanismType());
                mechDto.setQuantity(mechEntity.getQuantity());
                mechDto.setServiceDiscount(mechEntity.getServiceDiscount());
                mechDto.setDiscountType(mechEntity.getDiscountType());
                mechDto.setValue(mechEntity.getValue());
                mechDto.setMaxDiscountAmount(mechEntity.getMaxDiscountAmount());
                mechDto.setCouponcode(mechEntity.getCouponcode()); // Add Couponcode field
                mechDto.setDelFg(mechEntity.getDelFg());
                mechDto.setCreatedDate(mechEntity.getCreatedDate());
                mechDto.setUpdatedDate(mechEntity.getUpdatedDate());
                mechDto.setUsageLimitTotal(mechEntity.getUsageLimitTotal());
                mechDto.setUsageLimitPerUser(mechEntity.getUsageLimitPerUser());

                // --- Discount Products ---
                if (mechEntity.getDiscountProducts() != null) {
                    List<DiscountProductES_E> productDtos = new ArrayList<>();
                    for (DiscountProductEntity prodEntity : mechEntity.getDiscountProducts()) {
                        DiscountProductES_E prodDto = new DiscountProductES_E();
                        prodDto.setId(prodEntity.getId());
                        prodDto.setDiscountMechanismId(mechEntity.getId());
                        prodDto.setProductId(prodEntity.getProduct().getId());
                        // prodDto.setDiscountMechanism(mechDto); // REMOVE

                        // Map ProductDTO
                        if (prodEntity.getProduct() != null) {
                            ProductDTO productDto = new ProductDTO();
                            productDto.setId(prodEntity.getProduct().getId());
                            productDto.setName(prodEntity.getProduct().getName());
                            productDto.setDescription(prodEntity.getProduct().getDescription());
                            productDto.setBasePrice(prodEntity.getProduct().getBasePrice());
                            productDto.setCreatedDate(prodEntity.getProduct().getCreatedDate());

                            // Map Brand
                            if (prodEntity.getProduct().getBrand() != null) {
                                BrandDTO brandDto = new BrandDTO();
                                brandDto.setId(prodEntity.getProduct().getBrand().getId());
                                brandDto.setName(prodEntity.getProduct().getBrand().getName());
                                productDto.setBrand(brandDto);
                            }

                            // Map Category
                            if (prodEntity.getProduct().getCategory() != null) {
                                CategoryDTO categoryDto = new CategoryDTO();
                                categoryDto.setId(prodEntity.getProduct().getCategory().getId());
                                categoryDto.setName(prodEntity.getProduct().getCategory().getName());
                                productDto.setCategory(categoryDto);
                            }

                            prodDto.setProduct(productDto);
                        }
                        productDtos.add(prodDto);
                    }
                    mechDto.setDiscountProducts(productDtos);
                }

                // --- Free Gifts ---
                if (mechEntity.getFreeGifts() != null) {
                    List<FreeGiftES_F> giftDtos = new ArrayList<>();
                    for (FreeGiftEntity giftEntity : mechEntity.getFreeGifts()) {
                        FreeGiftES_F giftDto = new FreeGiftES_F();
                        giftDto.setId(giftEntity.getId());
                        giftDto.setMechanismId(mechEntity.getId());
                        giftDto.setProductId(giftEntity.getProduct().getId());
                        // giftDto.setDiscountMechanism(mechDto); // REMOVE

                        // Map ProductDTO
                        if (giftEntity.getProduct() != null) {
                            ProductDTO productDto = new ProductDTO();
                            productDto.setId(giftEntity.getProduct().getId());
                            productDto.setName(giftEntity.getProduct().getName());
                            productDto.setDescription(giftEntity.getProduct().getDescription());
                            productDto.setBasePrice(giftEntity.getProduct().getBasePrice());
                            productDto.setCreatedDate(giftEntity.getProduct().getCreatedDate());

                            // Map Brand
                            if (giftEntity.getProduct().getBrand() != null) {
                                BrandDTO brandDto = new BrandDTO();
                                brandDto.setId(giftEntity.getProduct().getBrand().getId());
                                brandDto.setName(giftEntity.getProduct().getBrand().getName());
                                productDto.setBrand(brandDto);
                            }

                            // Map Category
                            if (giftEntity.getProduct().getCategory() != null) {
                                CategoryDTO categoryDto = new CategoryDTO();
                                categoryDto.setId(giftEntity.getProduct().getCategory().getId());
                                categoryDto.setName(giftEntity.getProduct().getCategory().getName());
                                productDto.setCategory(categoryDto);
                            }

                            giftDto.setProduct(productDto);
                        }
                        giftDtos.add(giftDto);
                    }
                    mechDto.setFreeGifts(giftDtos);
                }

                // --- Condition Groups ---
                if (mechEntity.getDiscountConditionGroup() != null) {
                    List<DiscountConditionGroupES_C> groupDtos = new ArrayList<>();
                    for (DiscountConditionGroupEntity groupEntity : mechEntity.getDiscountConditionGroup()) {
                        DiscountConditionGroupES_C groupDto = new DiscountConditionGroupES_C();
                        groupDto.setId(groupEntity.getId());
                        groupDto.setLogicOperator(groupEntity.getLogicOperator());
                        groupDto.setDiscountMechanismId(mechEntity.getId());
                        // groupDto.setDiscountMechanism(mechDto); // REMOVE

                        // --- Conditions ---
                        if (groupEntity.getDiscountCondition() != null) {
                            List<DiscountConditionES_D> condDtos = new ArrayList<>();
                            for (DiscountConditionEntity condEntity : groupEntity.getDiscountCondition()) {
                                DiscountConditionES_D condDto = new DiscountConditionES_D();
                                condDto.setId(condEntity.getId());
                                condDto.setConditionType(condEntity.getConditionType());
                                condDto.setConditionDetail(condEntity.getConditionDetail());
                                condDto.setDelFg(condEntity.getDelFg());
                                condDto.setCreatedDate(condEntity.getCreatedDate());
                                condDto.setUpdatedDate(condEntity.getUpdatedDate());
                                condDto.setOperator(condEntity.getOperator());
                                try {
                                    ObjectMapper mapper = new ObjectMapper();
                                    // Always deserialize JSON string to String[]
                                    String valueStr = condEntity.getValue();
                                    if (valueStr == null || valueStr.isEmpty()) {
                                        condDto.setValue(new String[0]);
                                    } else {
                                        List<String> valueList = mapper.readValue(valueStr, new TypeReference<List<String>>() {
                                        });
                                        condDto.setValue(valueList.toArray(new String[0]));
                                    }
                                } catch (Exception e) {
                                    condDto.setValue(new String[0]); // fallback to empty array
                                }
                                condDto.setDiscountConditionGroupId(groupEntity.getId());
                                // condDto.setDiscountConditionGroup(groupDto); // REMOVE
                                condDtos.add(condDto);
                            }
                            groupDto.setDiscountCondition(condDtos);
                        }
                        groupDtos.add(groupDto);
                    }
                    mechDto.setDiscountConditionGroup(groupDtos);
                }
                mechanismDtos.add(mechDto);
            }
            dto.setDiscountMechanisms(mechanismDtos);
        }
        return dto;
    }

    // Utility method to parse JSON string to List<String>
    // String arry,convert to jason string , keep json string as string in db, return json string, convert to string array
    public List<String> parseValueJsonToList(String valueJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            // Specify type reference for List<String>
            return mapper.readValue(valueJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    // Example usage: Parse value field from DiscountMechanismEntity to List<String>
    public List<String> getMechanismValueList(DiscountMechanismEntity mechanism) {
        if (mechanism == null || mechanism.getValue() == null) {
            return new ArrayList<>();
        }
        return parseValueJsonToList(mechanism.getValue());
    }


    public void saveGroupConditions(Long groupId, List<DiscountConditionGroupES_C> groupDtos) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        for (DiscountConditionGroupES_C dto : groupDtos) {
            DiscountConditionGroupEntity groupEntity = new DiscountConditionGroupEntity();
            groupEntity.setLogicOperator(dto.getLogicOperator());
            groupEntity.setGroup(group);

            List<DiscountConditionEntity> condEntities = new ArrayList<>();
            if (dto.getDiscountCondition() != null) {
                for (DiscountConditionES_D condDto : dto.getDiscountCondition()) {
                    DiscountConditionEntity condEntity = new DiscountConditionEntity();
                    condEntity.setConditionType(condDto.getConditionType());
                    condEntity.setConditionDetail(condDto.getConditionDetail());
                    condEntity.setDelFg(condDto.getDelFg() != null ? condDto.getDelFg() : false);
                    condEntity.setCreatedDate(condDto.getCreatedDate() != null ? condDto.getCreatedDate() : LocalDateTime.now());
                    condEntity.setUpdatedDate(condDto.getUpdatedDate() != null ? condDto.getUpdatedDate() : LocalDateTime.now());
                    condEntity.setOperator(condDto.getOperator());
                    try {
                        ObjectMapper mapper = new ObjectMapper();

                        Object rawValue = condDto.getValue();
                        List<Object> normalized = new ArrayList<>();

                        if (rawValue instanceof String[]) {
                            // flatten strings by splitting commas, then convert to numbers or booleans if possible
                            for (String s : (String[]) rawValue) {
                                for (String part : s.split(",")) {
                                    String trimmed = part.trim();
                                    // try to parse numbers or booleans, else keep string
                                    if (trimmed.matches("-?\\d+")) {
                                        normalized.add(Integer.parseInt(trimmed));
                                    } else if (trimmed.equalsIgnoreCase("true") || trimmed.equalsIgnoreCase("false")) {
                                        normalized.add(Boolean.parseBoolean(trimmed));
                                    } else {
                                        normalized.add(trimmed);
                                    }
                                }
                            }
                        } else if (rawValue instanceof List) {
                            // You can do similar parsing for List<String>
                            List<?> list = (List<?>) rawValue;
                            for (Object val : list) {
                                String s = val.toString().trim();
                                if (s.matches("-?\\d+")) {
                                    normalized.add(Integer.parseInt(s));
                                } else if (s.equalsIgnoreCase("true") || s.equalsIgnoreCase("false")) {
                                    normalized.add(Boolean.parseBoolean(s));
                                } else {
                                    normalized.add(s);
                                }
                            }
                        } else {
                            // fallback: just put rawValue as string
                            normalized.add(rawValue);
                        }

// Now serialize normalized list as JSON array with numbers or booleans unquoted
                        condEntity.setValue(mapper.writeValueAsString(normalized));


                        // Always serialize String[] to JSON string
                        // condEntity.setValue(mapper.writeValueAsString(condDto.getValue()));
                    } catch (Exception e) {
                        condEntity.setValue("[]"); // fallback to empty array
                    }
                    condEntity.setDiscountConditionGroup(groupEntity);
                    condEntities.add(condEntity);
                }
            }
            groupEntity.setDiscountCondition(condEntities);

            conditionGroupRepository.save(groupEntity);
        }
    }

    // Get all condition groups for a group
    public List<DiscountConditionGroupES_C> getGroupConditions(Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
        List<DiscountConditionGroupEntity> groupEntities = group.getDiscountConditionGroups();
        List<DiscountConditionGroupES_C> dtos = new ArrayList<>();
        for (DiscountConditionGroupEntity entity : groupEntities) {
            DiscountConditionGroupES_C dto = new DiscountConditionGroupES_C();
            dto.setId(entity.getId());
            dto.setLogicOperator(entity.getLogicOperator());
            dto.setGroupId(groupId);
            // Map conditions
            List<DiscountConditionES_D> condDtos = new ArrayList<>();
            if (entity.getDiscountCondition() != null) {
                for (DiscountConditionEntity cond : entity.getDiscountCondition()) {
                    DiscountConditionES_D condDto = new DiscountConditionES_D();
                    condDto.setId(cond.getId());
                    condDto.setConditionType(cond.getConditionType());
                    condDto.setConditionDetail(cond.getConditionDetail());
                    condDto.setDelFg(cond.getDelFg());
                    condDto.setCreatedDate(cond.getCreatedDate());
                    condDto.setUpdatedDate(cond.getUpdatedDate());
                    condDto.setOperator(cond.getOperator());
                    // Always deserialize JSON string to String[]
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        String valueStr = cond.getValue();
                        if (valueStr == null || valueStr.isEmpty()) {
                            condDto.setValue(new String[0]);
                        } else {
                            List<String> valueList = mapper.readValue(valueStr, new TypeReference<List<String>>() {
                            });
                            condDto.setValue(valueList.toArray(new String[0]));
                        }
                    } catch (Exception e) {
                        condDto.setValue(new String[0]); // fallback to empty array
                    }
                    condDto.setDiscountConditionGroupId(entity.getId());
                    condDtos.add(condDto);
                }
            }
            dto.setDiscountCondition(condDtos);
            dtos.add(dto);
        }
        return dtos;
    }

    // Delete a condition group and its conditions
    public void deleteConditionGroup(Integer conditionGroupId) {
        conditionGroupRepository.deleteById(conditionGroupId);
    }

    private Boolean parseLogicOperator(Object logicOperator) {
        if (logicOperator instanceof Boolean) return (Boolean) logicOperator;
        if (logicOperator instanceof String) {
            String val = ((String) logicOperator).trim().toLowerCase();
            if ("true".equals(val)) return true;
            if ("false".equals(val)) return false;
        }
        return null; // or default to true/false as per your business rule
    }


}