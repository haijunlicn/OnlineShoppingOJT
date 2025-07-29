package com.maven.OnlineShoppingSB.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.maven.OnlineShoppingSB.audit.Audit;
import com.maven.OnlineShoppingSB.audit.AuditAspect;
import com.maven.OnlineShoppingSB.audit.AuditEventDTO;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class ProductService {

    @Autowired
    private BrandRepository brandRepo;
    @Autowired
    private CategoryRepository cateRepo;
    @Autowired
    private ProductRepository productRepo;
    @Autowired
    private OptionRepository optionRepo;
    @Autowired
    private OptionValueRepository optionValueRepo;
    @Autowired
    private ProductOptionRepository productOptionRepo;
    @Autowired
    private ProductImageRepository productImageRepo;
    @Autowired
    private ProductVariantRepository variantRepo;
    @Autowired
    private VariantSerialService variantSerialService;
    @Autowired
    private ModelMapper mapper;
    @Autowired
    private CloudinaryService cloudService;
    @Autowired
    private ApplicationEventPublisher auditPublisher;
    @Autowired
    private HttpServletRequest request;

    @Audit(action = "CREATE", entityType = "Product")
    @Transactional
    public ProductEntity createProduct(CreateProductRequestDTO request, UserEntity createdBy, HttpServletRequest httpRequest) {
        ProductDTO dto = request.getProduct();
        BrandEntity brand = null;
        if (dto.getBrandId() != null) {
            brand = findBrandById(dto.getBrandId());
        }
        CategoryEntity category = findCategoryById(dto.getCategoryId());

        ProductEntity product = new ProductEntity();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setBasePrice(dto.getBasePrice());
        product.setCreatedBy(createdBy);

        product = productRepo.save(product); // Save product (gets ID)

        if (request.getOptions() != null) {
            addProductOptions(product, request.getOptions(), httpRequest);
        }
        if (request.getVariants() != null) {
            addProductVariants(product, request.getVariants(), null, createdBy, httpRequest);
        }

        List<ProductImageEntity> addedImages = new ArrayList<>();
        if (request.getProductImages() != null) {
            addedImages = addProductImages(product, request.getProductImages());
        }

        product = productRepo.saveAndFlush(product); // save to assign IDs

        // **Prepare changes for logging**
        if (addedImages != null && !addedImages.isEmpty()) {
            List<ProductImageDTO.ProductImageChange> addedChanges = addedImages.stream()
                    .map(image -> new ProductImageDTO.ProductImageChange(
                            image.getId(),
                            "ADDED",
                            image.getImgPath(),
                            image.getAltText(),
                            image.getDisplayOrder(),
                            image.isMainImageStatus(),
                            null
                    ))
                    .collect(Collectors.toList());

            ProductImageDTO.ProductImageUpdateLogResult changes = new ProductImageDTO.ProductImageUpdateLogResult(
                    addedChanges,
                    Collections.emptyList(),
                    Collections.emptyList()
            );

            // **Pass the HttpServletRequest so IP and UA can be logged**
            logProductImageChanges(changes, product.getId(), createdBy, httpRequest);
        }

        return product;
    }

    @Audit(action = "UPDATE", entityType = "Product")
    @Transactional
    public ProductEntity updateProduct(CreateProductRequestDTO request, UserEntity createdBy, HttpServletRequest httpRequest) {
        ProductDTO dto = request.getProduct();

        ProductEntity product = productRepo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + dto.getId()));

        // Map existing entity to DTO for old snapshot
        ProductDTO oldProductDTO = mapper.map(product, ProductDTO.class);
        dto.setOldSnapshot(oldProductDTO); // For auditing

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        BrandEntity brand = null;
        if (dto.getBrandId() != null) {
            brand = findBrandById(dto.getBrandId());
        }
        product.setBrand(brand);
        product.setCategory(findCategoryById(dto.getCategoryId()));
        product.setBasePrice(dto.getBasePrice());

        // Update options similarly (fetch if needed)
        product.getOptions().clear();
        productOptionRepo.deleteByProductId(product.getId());
        if (request.getOptions() != null) {
            addProductOptions(product, request.getOptions(), httpRequest);
        }

        // Handle variants
        Map<Long, ProductVariantEntity> existingVariants = variantRepo
                .findByProductIdAndDelFg(product.getId(), 1)
                .stream()
                .collect(Collectors.toMap(ProductVariantEntity::getId, v -> v));
        if (request.getVariants() != null) {
            addProductVariants(product, request.getVariants(), existingVariants, createdBy, httpRequest);
        }

        // Update images with diff detection and logging
        List<ProductImageEntity> existingImages = productImageRepo.findByProductId(product.getId());
        ProductImageDTO.ProductImageUpdateLogResult imageChanges = updateProductImages(existingImages, product, request.getProductImages());
        logProductImageChanges(imageChanges, product.getId(), createdBy, httpRequest);

        product = productRepo.save(product);  // Save updated product

        return product;  // Return updated entity for audit
    }

    @Transactional
    public void updateStock(StockUpdateRequestDTO request, UserEntity user) {
        for (StockUpdateRequestDTO.StockChange change : request.getStockUpdates()) {
            ProductVariantEntity variant = variantRepo.findById(change.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variant not found: " + change.getVariantId()));

            Integer oldStock = variant.getStock();
            variant.setStock(change.getNewStock());

            // Only audit if stock changed
            if (change.getNewStock() != (oldStock != null ? oldStock : 0)) {

                Map<String, Object> changes = new HashMap<>();
                changes.put("stock", Map.of("old", oldStock, "new", change.getNewStock()));

                AuditEventDTO event = new AuditEventDTO(
                        "UPDATE",
                        "ProductVariant",
                        variant.getId(),
                        Map.of("productId", variant.getProduct().getId(), "changes", changes),
                        user.getId(),
                        user.getName(),
                        user.getRole().getName(),
                        null,
                        null
                );

                auditPublisher.publishEvent(event);
            }
        }
    }

    // ───────────────────────────────────────────────
    // Private Helper Methods
    // ───────────────────────────────────────────────

    private BrandEntity findBrandById(Long id) {
        return brandRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));
    }

    private CategoryEntity findCategoryById(Long id) {
        return cateRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    private OptionEntity findOptionById(Long id) {
        return optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option not found with id: " + id));
    }

    private void addProductOptions(ProductEntity product, List<OptionDTO> options, HttpServletRequest httpRequest) {
        for (OptionDTO optionDto : options) {
            OptionEntity option = findOptionById(optionDto.getId());

            ProductOptionEntity productOption = new ProductOptionEntity();
            productOption.setProduct(product);
            productOption.setOption(option);

            product.getOptions().add(productOption);
        }
    }

    private void addProductVariants(ProductEntity product,
                                    List<ProductVariantDTO> variantDTOs,
                                    Map<Long, ProductVariantEntity> existingVariants,
                                    UserEntity createdBy,
                                    HttpServletRequest httpRequest) {

        List<ProductVariantDTO.ProductVariantChange> addedVariants = new ArrayList<>();
        List<ProductVariantDTO.ProductVariantChange> updatedVariants = new ArrayList<>();
        List<ProductVariantDTO.ProductVariantChange> removedVariants = new ArrayList<>();

        // 🔥 Handle removals (soft delete)
        //

        for (ProductVariantDTO variantDto : variantDTOs) {
            ProductVariantEntity variant;
            boolean isExisting = variantDto.getId() != null;

            if (isExisting) {
                // ✅ Update existing variant
                variant = existingVariants.get(variantDto.getId());
                if (variant == null) {
                    throw new RuntimeException("Variant not found with id: " + variantDto.getId());
                }

                // Create old snapshot BEFORE changes
                Map<String, Object> oldSnapshot = createOldSnapshotForVariant(variant);

                variant.setProduct(product);
                variant.setStock(variantDto.getStock());
                variant.setImgPath(variantDto.getImgPath());
                // 🔒 Keep existing SKU (do not modify)

                // Update variantOptionValues
                Set<Long> incomingValueIds = variantDto.getOptions().stream()
                        .map(VariantOptionDTO::getOptionValueId)
                        .collect(Collectors.toSet());

                List<VariantOptionValueEntity> toRemove = new ArrayList<>();
                Set<Long> existingValueIds = new HashSet<>();

                for (VariantOptionValueEntity existingValue : variant.getVariantOptionValues()) {
                    Long existingId = existingValue.getOptionValue().getId();
                    existingValueIds.add(existingId);
                    if (!incomingValueIds.contains(existingId)) {
                        toRemove.add(existingValue);
                    }
                }

                variant.getVariantOptionValues().removeAll(toRemove);

                for (VariantOptionDTO opt : variantDto.getOptions()) {
                    if (!existingValueIds.contains(opt.getOptionValueId())) {
                        OptionEntity option = findOptionById(opt.getOptionId());
                        OptionValueEntity value = optionValueRepo.findByOptionAndId(option, opt.getOptionValueId())
                                .orElseThrow(() -> new RuntimeException("OptionValue not found"));

                        VariantOptionValueEntity newVal = new VariantOptionValueEntity();
                        newVal.setVariant(variant);
                        newVal.setOptionValue(value);
                        variant.getVariantOptionValues().add(newVal);
                    }
                }

                updateVariantPrice(variant, variantDto.getPrice(), createdBy);

                // Prepare options display list for logging
                List<ProductVariantDTO.VariantOptionDisplay> optionDisplays = variantDto.getOptions().stream()
                        .map(opt -> new ProductVariantDTO.VariantOptionDisplay(
                                findOptionById(opt.getOptionId()).getName(),
                                optionValueRepo.findById(opt.getOptionValueId())
                                        .map(OptionValueEntity::getValue)
                                        .orElse("")
                        ))
                        .collect(Collectors.toList());

                // Create new snapshot for comparison
                Map<String, Object> newSnapshot = new HashMap<>();
                newSnapshot.put("sku", variant.getSku());
                newSnapshot.put("stock", variant.getStock());
                newSnapshot.put("imgPath", variant.getImgPath());
                BigDecimal newPrice = null;
                if (variantDto.getPrice() != null) {
                    newPrice = new BigDecimal(variantDto.getPrice().toString()).setScale(2, RoundingMode.HALF_UP);
                }
                newSnapshot.put("price", newPrice);

                // Use your diff method (assuming it returns a Map of changed fields)

                Map<String, Object> diff = AuditAspect.getDifferences(oldSnapshot, newSnapshot);

                if (!diff.isEmpty()) {
                    updatedVariants.add(new ProductVariantDTO.ProductVariantChange(
                            variant.getId(),
                            "UPDATED",
                            variant.getSku(),
                            variant.getStock(),
                            variant.getImgPath(),
                            variantDto.getPrice(),
                            optionDisplays,
                            oldSnapshot
                    ));
                } else {
                    // No actual change, skip logging
                    System.out.println("No real changes detected for variant id " + variant.getId() + ", skipping audit log.");
                }

            } else {
                // ✅ Add new variant
                variant = new ProductVariantEntity();
                variant.setProduct(product);
                variant.setStock(variantDto.getStock());
                variant.setImgPath(variantDto.getImgPath());
                variant.setCreatedBy(createdBy);

                // 🔧 Generate SKU: use baseSku from frontend + serial
                String baseSku = variantDto.getSku(); // Must be sent from frontend
                if (baseSku == null || baseSku.isBlank()) {
                    throw new RuntimeException("Base SKU must be provided for new variants");
                }

                long serial = variantSerialService.getNextSerial();
                String paddedSerial = String.format("%05d", serial);
                variant.setSku(baseSku + "-" + paddedSerial);

                for (VariantOptionDTO opt : variantDto.getOptions()) {
                    OptionEntity option = findOptionById(opt.getOptionId());
                    OptionValueEntity value = optionValueRepo.findByOptionAndId(option, opt.getOptionValueId())
                            .orElseThrow(() -> new RuntimeException("OptionValue not found"));

                    VariantOptionValueEntity newVal = new VariantOptionValueEntity();
                    newVal.setVariant(variant);
                    newVal.setOptionValue(value);
                    variant.getVariantOptionValues().add(newVal);
                }

                updateVariantPrice(variant, variantDto.getPrice(), createdBy);

                // Prepare options display list for logging
                List<ProductVariantDTO.VariantOptionDisplay> optionDisplays = variantDto.getOptions().stream()
                        .map(opt -> new ProductVariantDTO.VariantOptionDisplay(
                                findOptionById(opt.getOptionId()).getName(),
                                optionValueRepo.findById(opt.getOptionValueId())
                                        .map(OptionValueEntity::getValue)
                                        .orElse("")
                        ))
                        .collect(Collectors.toList());

                addedVariants.add(new ProductVariantDTO.ProductVariantChange(
                        variant.getId(),
                        "ADDED",
                        variant.getSku(),
                        variant.getStock(),
                        variant.getImgPath(),
                        variantDto.getPrice(),
                        optionDisplays,
                        null // no old snapshot for new variants
                ));
            }

            if (!product.getVariants().contains(variant)) {
                product.getVariants().add(variant);
            }
        }

        variantRepo.flush();

        // After all processing, call the log method
        ProductVariantDTO.ProductVariantUpdateLogResult changes = new ProductVariantDTO.ProductVariantUpdateLogResult(
                addedVariants,
                removedVariants,
                updatedVariants
        );

        logProductVariantChanges(changes, product.getId(), createdBy, httpRequest);
    }

    // Helper method example to create old snapshot for logging
    private Map<String, Object> createOldSnapshotForVariant(ProductVariantEntity variant) {
        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("sku", variant.getSku());
        snapshot.put("stock", variant.getStock());
        snapshot.put("imgPath", variant.getImgPath());
        // Example for price: get current active price if exists
        BigDecimal activePrice = variant.getPrices().stream()
                .filter(p -> {
                    LocalDateTime now = LocalDateTime.now();
                    return (p.getStartDate() == null || !p.getStartDate().isAfter(now)) &&
                            (p.getEndDate() == null || p.getEndDate().isAfter(now));
                })
                .findFirst()
                .map(VariantPriceEntity::getPrice)
                .orElse(null);
        snapshot.put("price", activePrice);
        return snapshot;
    }

    private List<ProductImageEntity> addProductImages(ProductEntity product, List<ProductImageDTO> imageDTOs) {
        List<ProductImageEntity> savedImages = new ArrayList<>();

        for (ProductImageDTO imageDto : imageDTOs) {
            ProductImageEntity image = new ProductImageEntity();
            image.setProduct(product);
            image.setImgPath(imageDto.getImgPath());
            image.setDisplayOrder(imageDto.getDisplayOrder());
            image.setAltText(imageDto.getAltText());
            image.setMainImageStatus(Boolean.TRUE.equals(imageDto.isMainImageStatus()));
            savedImages.add(image); // collect image
        }

        product.getProductImages().addAll(savedImages);
        return savedImages; // return for logging
    }

//    @org.springframework.transaction.annotation.Transactional(readOnly = true)
//    public List<ProductListItemDTO> getAllPublicProducts() {
//        List<ProductEntity> products = productRepo.findByDelFgAndBrand_DelFgAndCategory_DelFgOrderByCreatedDateDesc(1, 1, 1);
//        return products.stream()
//                .map(this::mapToProductListItemDTO)
//                .collect(Collectors.toList());
//    }
//
//    @org.springframework.transaction.annotation.Transactional(readOnly = true)
//    public List<ProductListItemDTO> getAllProducts() {
//        List<ProductEntity> products = productRepo.findAll(Sort.by(Sort.Direction.DESC, "createdDate"));
//        return products.stream()
//                .map(this::mapToProductListItemDTO)
//                .collect(Collectors.toList());
//    }
//
//    @org.springframework.transaction.annotation.Transactional(readOnly = true)
//    public ProductListItemDTO getProductById(Long id) {
//        ProductEntity product = productRepo.findById(id)
//                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));
//        return mapToProductListItemDTO(product);
//    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ProductListItemDTO> getAllPublicProducts() {
        List<ProductEntity> products = productRepo
                .findByDelFgAndBrand_DelFgAndCategory_DelFgOrderByCreatedDateDesc(1, 1, 1);

        return products.stream()
                .map(product -> mapToProductListItemDTO(product, false)) // false = don't include deleted variants
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ProductListItemDTO> getAllProducts() {
        List<ProductEntity> products = productRepo.findAll(Sort.by(Sort.Direction.DESC, "createdDate"));

        return products.stream()
                .map(product -> mapToProductListItemDTO(product, true)) // true = include all variants, including deleted
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ProductListItemDTO getPublicProductById(Long id) {
        ProductEntity product = productRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        return mapToProductListItemDTO(product, false); // assuming admin access
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ProductListItemDTO getProductById(Long id) {
        ProductEntity product = productRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));

        return mapToProductListItemDTO(product, true); // assuming admin access
    }

    private void updateVariantPrice(ProductVariantEntity variant, BigDecimal newPrice, UserEntity createdBy) {
        LocalDateTime now = LocalDateTime.now();

        VariantPriceEntity currentPrice = variant.getPrices().stream()
                .filter(price ->
                        (price.getStartDate() == null || !price.getStartDate().isAfter(now)) &&
                                (price.getEndDate() == null || !price.getEndDate().isBefore(now))
                )
                .findFirst()
                .orElse(null);

        if (currentPrice != null && currentPrice.getPrice().compareTo(newPrice) == 0) {
            return; // No change
        }

        if (currentPrice != null) {
            currentPrice.setEndDate(now); // Expire old price
        }

        VariantPriceEntity newPriceEntity = new VariantPriceEntity();
        newPriceEntity.setVariant(variant);
        newPriceEntity.setPrice(newPrice);
        newPriceEntity.setStartDate(now);
        newPriceEntity.setCreatedBy(createdBy);
        variant.getPrices().add(newPriceEntity);
    }

//    private ProductListItemDTO mapToProductListItemDTO(ProductEntity product) {
//        ProductDTO productDTO = mapper.map(product, ProductDTO.class);
//        CategoryDTO categoryDTO = mapper.map(product.getCategory(), CategoryDTO.class);
//        BrandDTO brandDTO = product.getBrand() != null ? mapper.map(product.getBrand(), BrandDTO.class) : null;
//
//        List<ProductVariantEntity> variantEntities = variantRepo.findByProductIdAndDelFg(product.getId(), 1);
//        List<ProductVariantDTO> variants = mapToProductVariantDTOList(variantEntities);
//
//        List<ProductOptionDTO> options = productOptionRepo.findByProduct(product).stream()
//                .map(po -> {
//                    OptionEntity option = po.getOption();
//
//                    List<OptionValueEntity> usedOptionValues = product.getVariants().stream()
//                            .filter(variant -> variant.getDelFg() != null && variant.getDelFg() == 1)
//                            .flatMap(variant -> variant.getVariantOptionValues().stream())
//                            .map(VariantOptionValueEntity::getOptionValue)
//                            .filter(val -> val.getOption().getId().equals(option.getId()))
//                            .distinct()
//                            .collect(Collectors.toList());
//
//                    ProductOptionDTO optionDTO = new ProductOptionDTO();
//                    optionDTO.setId(option.getId());
//                    optionDTO.setName(option.getName());
//                    optionDTO.setOptionValues(usedOptionValues.stream().map(val -> {
//                        OptionValueDTO valDTO = new OptionValueDTO();
//                        valDTO.setId(val.getId());
//                        valDTO.setOptionId(option.getId());
//                        valDTO.setValue(val.getValue());
//                        valDTO.setCreatedDate(val.getCreatedDate());
//                        valDTO.setUpdatedDate(val.getUpdatedDate());
//                        valDTO.setDel_fg(val.getDelFg());
//                        return valDTO;
//                    }).collect(Collectors.toList()));
//
//                    return optionDTO;
//                }).collect(Collectors.toList());
//
//        List<ProductImageDTO> images = product.getProductImages().stream()
//                .map(img -> mapper.map(img, ProductImageDTO.class))
//                .collect(Collectors.toList());
//
//        ProductListItemDTO item = new ProductListItemDTO();
//        item.setId(product.getId());
//        item.setProduct(productDTO);
//        item.setBrand(brandDTO);
//        item.setCategory(categoryDTO);
//        item.setVariants(variants);
//        item.setOptions(options);
//        item.setImages(images);
//
//        return item;
//    }

    private ProductListItemDTO mapToProductListItemDTO(ProductEntity product, boolean forAdmin) {
        ProductDTO productDTO = mapper.map(product, ProductDTO.class);
        CategoryDTO categoryDTO = mapper.map(product.getCategory(), CategoryDTO.class);
        BrandDTO brandDTO = product.getBrand() != null ? mapper.map(product.getBrand(), BrandDTO.class) : null;

        // Use filtered variants based on forAdmin
        List<ProductVariantEntity> variantEntities = forAdmin
                ? variantRepo.findByProductId(product.getId())
                : variantRepo.findByProductIdAndDelFg(product.getId(), 1);

        List<ProductVariantDTO> variants = mapToProductVariantDTOList(variantEntities, forAdmin);

        // Option values should be collected from variantEntities (not all product variants)
        List<ProductOptionDTO> options = productOptionRepo.findByProduct(product).stream()
                .map(po -> {
                    OptionEntity option = po.getOption();

                    List<OptionValueEntity> usedOptionValues = variantEntities.stream()
                            .flatMap(variant -> variant.getVariantOptionValues().stream())
                            .map(VariantOptionValueEntity::getOptionValue)
                            .filter(val -> val.getOption().getId().equals(option.getId()))
                            .distinct()
                            .collect(Collectors.toList());

                    ProductOptionDTO optionDTO = new ProductOptionDTO();
                    optionDTO.setId(option.getId());
                    optionDTO.setName(option.getName());
                    optionDTO.setOptionValues(usedOptionValues.stream().map(val -> {
                        OptionValueDTO valDTO = new OptionValueDTO();
                        valDTO.setId(val.getId());
                        valDTO.setOptionId(option.getId());
                        valDTO.setValue(val.getValue());
                        valDTO.setCreatedDate(val.getCreatedDate());
                        valDTO.setUpdatedDate(val.getUpdatedDate());
                        valDTO.setDel_fg(val.getDelFg());
                        return valDTO;
                    }).collect(Collectors.toList()));

                    return optionDTO;
                }).collect(Collectors.toList());

        List<ProductImageDTO> images = product.getProductImages().stream()
                .map(img -> mapper.map(img, ProductImageDTO.class))
                .collect(Collectors.toList());

        ProductListItemDTO item = new ProductListItemDTO();
        item.setId(product.getId());
        item.setProduct(productDTO);
        item.setBrand(brandDTO);
        item.setCategory(categoryDTO);
        item.setVariants(variants);
        item.setOptions(options);
        item.setImages(images);

        return item;
    }

    private List<ProductVariantDTO> mapToProductVariantDTOList(List<ProductVariantEntity> variants, boolean forAdmin) {
        LocalDateTime now = LocalDateTime.now();

        return variants.stream()
                .filter(variant -> forAdmin || (variant.getDelFg() != null && variant.getDelFg() == 1))
                .map(variant -> {
                    ProductVariantDTO dto = new ProductVariantDTO();
                    dto.setId(variant.getId());
                    dto.setSku(variant.getSku());
                    dto.setImgPath(variant.getImgPath());
                    dto.setStock(variant.getStock());
                    dto.setCreatedBy(userDTO.fromEntity(variant.getCreatedBy()));
                    dto.setCreatedDate(variant.getCreatedDate());
                    dto.setDelFg(variant.getDelFg());

                    VariantPriceEntity currentPrice = variant.getPrices().stream()
                            .filter(price ->
                                    (price.getStartDate() == null || !price.getStartDate().isAfter(now)) &&
                                            (price.getEndDate() == null || !price.getEndDate().isBefore(now))
                            )
                            .findFirst()
                            .orElse(null);

                    if (currentPrice != null) {
                        dto.setPrice(currentPrice.getPrice());
                    }

                    dto.setOptions(variant.getVariantOptionValues().stream()
                            .filter(vov -> forAdmin || (vov.getOptionValue().getDelFg() != null && vov.getOptionValue().getDelFg() == 1))
                            .map(vov -> {
                                OptionValueEntity val = vov.getOptionValue();
                                OptionEntity opt = val.getOption();

                                VariantOptionDTO optDTO = new VariantOptionDTO();
                                optDTO.setOptionId(opt.getId());
                                optDTO.setOptionName(opt.getName());
                                optDTO.setOptionValueId(val.getId());
                                optDTO.setValueName(val.getValue());

                                return optDTO;
                            }).collect(Collectors.toList())
                    );

                    return dto;
                })
                .collect(Collectors.toList());
    }

//    private List<ProductVariantDTO> mapToProductVariantDTOList(List<ProductVariantEntity> variants) {
//        LocalDateTime now = LocalDateTime.now();
//
//        return variants.stream()
//                .map(variant -> {
//                    ProductVariantDTO dto = new ProductVariantDTO();
//                    dto.setId(variant.getId());
//                    dto.setSku(variant.getSku());
//                    dto.setImgPath(variant.getImgPath());
//                    dto.setStock(variant.getStock());
//                    dto.setCreatedBy(userDTO.fromEntity(variant.getCreatedBy()));
//                    dto.setCreatedDate(variant.getCreatedDate());
//                    dto.setDelFg(variant.getDelFg());
//
//                    VariantPriceEntity currentPrice = variant.getPrices().stream()
//                            .filter(price ->
//                                    (price.getStartDate() == null || !price.getStartDate().isAfter(now)) &&
//                                            (price.getEndDate() == null || !price.getEndDate().isBefore(now))
//                            )
//                            .findFirst()
//                            .orElse(null);
//
//                    if (currentPrice != null) {
//                        dto.setPrice(currentPrice.getPrice());
//                    }
//
//                    dto.setOptions(variant.getVariantOptionValues().stream()
//                            .map(vov -> {
//                                OptionValueEntity val = vov.getOptionValue();
//                                OptionEntity opt = val.getOption();
//
//                                VariantOptionDTO optDTO = new VariantOptionDTO();
//                                optDTO.setOptionId(opt.getId());
//                                optDTO.setOptionName(opt.getName());
//                                optDTO.setOptionValueId(val.getId());
//                                optDTO.setValueName(val.getValue());
//
//                                return optDTO;
//                            }).collect(Collectors.toList())
//                    );
//
//                    return dto;
//                })
//                .collect(Collectors.toList());
//    }

    // Provide Excel template as InputStreamResource
    public InputStreamResource getExcelTemplate() throws IOException {
        InputStream is = new ClassPathResource("templates/product_upload_template.xlsx").getInputStream();
        return new InputStreamResource(is);
    }

// Process uploaded ZIP file (Excel + images)

    @Transactional
    public void processZipFile(MultipartFile zipFile, UserEntity createdBy, HttpServletRequest httpRequest) throws IOException {
        Path tempDir = Files.createTempDirectory("uploadZip");

        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path filePath = tempDir.resolve(entry.getName());
                if (entry.isDirectory()) {
                    Files.createDirectories(filePath);
                } else {
                    Files.createDirectories(filePath.getParent());
                    Files.copy(zis, filePath, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }

        // 1. Find Excel file inside extracted files
        Path excelFile = Files.list(tempDir)
                .filter(path -> path.toString().endsWith(".xlsx") || path.toString().endsWith(".xls"))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Excel file not found inside ZIP"));

        // 2. Upload images to Cloudinary
        Path imagesDir = tempDir;
        Map<String, String> uploadedImageUrls = uploadImagesToCloudinary(imagesDir);

        // 3. Parse Excel and build DTOs
        List<CreateProductRequestDTO> products = parseExcelToProductDTOs(excelFile.toFile());

        // 4. Replace local image paths with Cloudinary URLs
        for (CreateProductRequestDTO productDTO : products) {
            // Product images
            for (ProductImageDTO imageDTO : productDTO.getProductImages()) {
                String localPath = imageDTO.getImgPath();
                if (localPath != null && uploadedImageUrls.containsKey(localPath)) {
                    imageDTO.setImgPath(uploadedImageUrls.get(localPath));
                } else {
                    System.err.println("No uploaded URL found for product image: " + localPath);
                }
            }

            // Variant images
            for (ProductVariantDTO variantDTO : productDTO.getVariants()) {
                String localPath = variantDTO.getImgPath();
                if (localPath != null && uploadedImageUrls.containsKey(localPath)) {
                    variantDTO.setImgPath(uploadedImageUrls.get(localPath));
                } else {
                    System.err.println("No uploaded URL found for variant image: " + localPath);
                }
            }
        }

        // 5. Save products to DB
        System.out.println("products parsed : " + products);
        for (CreateProductRequestDTO productDTO : products) {
            createProduct(productDTO, createdBy, httpRequest);
        }

        // 6. Cleanup
        deleteDirectoryRecursively(tempDir);
    }

    private Map<String, String> uploadImagesToCloudinary(Path imagesDir) throws IOException {
        Map<String, String> imageNameToUrl = new HashMap<>();

        if (!Files.exists(imagesDir) || !Files.isDirectory(imagesDir)) {
            return imageNameToUrl;
        }

        try (Stream<Path> files = Files.list(imagesDir)) {
            files.filter(Files::isRegularFile)
                    .forEach(path -> {
                        String filename = path.getFileName().toString();
                        try {
                            String url = cloudService.uploadFile(path.toFile());
                            imageNameToUrl.put(filename, url);
                            System.out.println("Uploaded " + filename + " to " + url);
                        } catch (Exception e) {
                            System.err.println("Failed to upload " + filename + ": " + e.getMessage());
                        }
                    });
        }

        return imageNameToUrl;
    }

    private void deleteDirectoryRecursively(Path path) throws IOException {
        if (Files.exists(path)) {
            Files.walk(path)
                    .sorted(Comparator.reverseOrder())
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                        } catch (IOException e) {
                            // Log if needed
                        }
                    });
        }
    }

    private List<CreateProductRequestDTO> parseExcelToProductDTOs(File excelFile) {
        Map<String, CreateProductRequestDTO> productMap = new LinkedHashMap<>();

        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {

            System.out.println("Workbook loaded successfully.");

            // 1. Load all options and option values from DB with normalization
            System.out.println("Loading all options and option values from DB...");
            Map<String, OptionEntity> optionNameMap = optionRepo.findAll().stream()
                    .collect(Collectors.toMap(
                            opt -> opt.getName().trim().toLowerCase(),
                            opt -> opt,
                            (o1, o2) -> o1,
                            LinkedHashMap::new));

            Map<Long, Map<String, OptionValueEntity>> optionValueMap = optionValueRepo.findAll().stream()
                    .collect(Collectors.groupingBy(
                            val -> val.getOption().getId(),
                            Collectors.toMap(
                                    val -> val.getValue().trim().toLowerCase(),
                                    val -> val,
                                    (v1, v2) -> v1)));

            Map<Long, OptionValueEntity> optionValueById = optionValueRepo.findAll().stream()
                    .collect(Collectors.toMap(OptionValueEntity::getId, Function.identity()));


            System.out.println("Loaded " + optionNameMap.size() + " options and option values grouped by option.");

            // 2. Parse Product sheet
            System.out.println("Parsing Product sheet...");
            Sheet productSheet = workbook.getSheet("Product");
            if (productSheet == null) throw new RuntimeException("Product sheet not found");

            for (int i = 1; i <= productSheet.getLastRowNum(); i++) {
                Row row = productSheet.getRow(i);
                if (row == null) {
                    System.out.println("Row " + i + " empty, skipping.");
                    continue;
                }

                String name = getCellString(row.getCell(0));
                if (name == null || name.isBlank()) {
                    System.out.println("Row " + i + " product name empty, skipping.");
                    continue;
                }

                try {
                    Long brandId = getCellLong(row.getCell(2));
                    Long categoryId = getCellLong(row.getCell(3));
                    if (brandId == null || categoryId == null) {
                        System.err.printf("Row %d missing brandId or categoryId. Skipping.%n", i);
                        continue;
                    }

                    ProductDTO productDTO = new ProductDTO();
                    productDTO.setName(name.trim());
                    productDTO.setDescription(getCellString(row.getCell(1)));
                    productDTO.setBrandId(brandId);
                    productDTO.setCategoryId(categoryId);
                    productDTO.setBasePrice(getCellDecimal(row.getCell(4)));

                    CreateProductRequestDTO createDTO = new CreateProductRequestDTO();
                    createDTO.setProduct(productDTO);
                    createDTO.setOptions(new ArrayList<>());
                    createDTO.setVariants(new ArrayList<>());
                    createDTO.setProductImages(new ArrayList<>());

                    // Parse images with defaults if missing
                    String imagesStr = getCellString(row.getCell(5));
                    String displayOrdersStr = getCellString(row.getCell(6));
                    String mainStatusesStr = getCellString(row.getCell(7));
                    String altTextsStr = getCellString(row.getCell(8));

                    List<String> images = imagesStr != null ? Arrays.stream(imagesStr.split(",")).map(String::trim).collect(Collectors.toList()) : Collections.emptyList();
                    List<String> displayOrders = displayOrdersStr != null ? Arrays.stream(displayOrdersStr.split(",")).map(String::trim).collect(Collectors.toList()) : new ArrayList<>();
                    List<String> mainStatuses = mainStatusesStr != null ? Arrays.stream(mainStatusesStr.split(",")).map(String::trim).collect(Collectors.toList()) : new ArrayList<>();
                    List<String> altTexts = altTextsStr != null ? Arrays.stream(altTextsStr.split(",")).map(String::trim).collect(Collectors.toList()) : new ArrayList<>();

                    int imgCount = images.size();
                    while (displayOrders.size() < imgCount) displayOrders.add("0");
                    while (mainStatuses.size() < imgCount) mainStatuses.add("false");
                    while (altTexts.size() < imgCount) altTexts.add("");

                    for (int idx = 0; idx < imgCount; idx++) {
                        ProductImageDTO img = new ProductImageDTO();
                        img.setImgPath(images.get(idx));
                        img.setDisplayOrder(parseIntegerSafe(displayOrders.get(idx), 0));
                        img.setMainImageStatus(parseBooleanSafe(mainStatuses.get(idx), false));
                        img.setAltText(altTexts.get(idx));
                        createDTO.getProductImages().add(img);
                    }

                    productMap.put(name.trim(), createDTO);
                    System.out.println("Parsed product '" + name.trim() + "' with " + imgCount + " images.");

                } catch (Exception e) {
                    System.err.println("Error parsing product sheet row " + i + ": " + e.getMessage());
                    e.printStackTrace();
                    throw e;
                }
            }

            // 3. Parse Variant sheet
            System.out.println("Parsing Variant sheet...");
            Sheet variantSheet = workbook.getSheet("Variant");
            if (variantSheet == null) throw new RuntimeException("Variant sheet not found");

            Row headerRow = variantSheet.getRow(0);
            int lastCell = headerRow.getLastCellNum();

            Integer nameCol = null, skuCol = null, stockCol = null, priceCol = null, imgPathCol = null;
            for (int c = 0; c < lastCell; c++) {
                String val = getCellString(headerRow.getCell(c));
                if ("product_name".equalsIgnoreCase(val)) nameCol = c;
                else if ("sku".equalsIgnoreCase(val)) skuCol = c;
                else if ("stock".equalsIgnoreCase(val)) stockCol = c;
                else if ("price".equalsIgnoreCase(val)) priceCol = c;
                else if ("imgPath".equalsIgnoreCase(val)) imgPathCol = c;
            }

            if (nameCol == null || skuCol == null || stockCol == null || priceCol == null || imgPathCol == null)
                throw new RuntimeException("Variant sheet missing required columns");

            for (int i = 1; i <= variantSheet.getLastRowNum(); i++) {
                Row row = variantSheet.getRow(i);
                if (row == null) {
                    System.out.println("Variant row " + i + " empty, skipping.");
                    continue;
                }

                try {
                    String productName = getCellString(row.getCell(nameCol));
                    if (productName == null || productName.isBlank() || !productMap.containsKey(productName.trim())) {
                        System.err.println("Variant row " + i + " has unknown product '" + productName + "', skipping.");
                        continue;
                    }
                    productName = productName.trim();

                    ProductVariantDTO variant = new ProductVariantDTO();
                    variant.setSku(getCellString(row.getCell(skuCol)));
                    variant.setStock(getCellInt(row.getCell(stockCol)));
                    variant.setImgPath(getCellString(row.getCell(imgPathCol)));

                    VariantPriceDTO priceDTO = new VariantPriceDTO();
                    priceDTO.setPrice(getCellDecimal(row.getCell(priceCol)));
                    priceDTO.setStartDate(LocalDateTime.now());
                    variant.setPrice(priceDTO.getPrice());

                    List<VariantOptionDTO> optionList = new ArrayList<>();
                    for (int col = imgPathCol + 1; col < headerRow.getLastCellNum(); col++) {
                        String optionNameRaw = getCellString(headerRow.getCell(col));
                        String optionValueRaw = getCellString(row.getCell(col));

                        System.out.printf("Row %d, Col %d - optionNameRaw='%s', optionValueRaw='%s'%n",
                                i, col, optionNameRaw, optionValueRaw);

                        if (optionNameRaw == null || optionValueRaw == null || optionValueRaw.isBlank()) {
                            System.out.println("Skipping due to null or blank option name/value");
                            continue;
                        }

                        String optionName = optionNameRaw.trim().toLowerCase();
                        String optionValue = optionValueRaw.trim().toLowerCase();

                        System.out.printf("Normalized: optionName='%s', optionValue='%s'%n", optionName, optionValue);

                        OptionEntity optEntity = optionNameMap.get(optionName);
                        if (optEntity == null) {
                            System.err.printf("Variant row %d unknown option '%s'. Skipping this option.%n", i, optionNameRaw);
                            continue;
                        } else {
                            System.out.printf("Found OptionEntity with id=%d for optionName='%s'%n", optEntity.getId(), optionNameRaw);
                        }

                        Map<String, OptionValueEntity> valueMap = optionValueMap.get(optEntity.getId());
                        if (valueMap == null) {
                            System.err.printf("Variant row %d option '%s' has no option values in DB. Skipping this option.%n", i, optionNameRaw);
                            continue;
                        }

                        OptionValueEntity valEntity = valueMap.get(optionValue);

                        if (valEntity == null) {
                            try {
                                Long valueId = Long.parseLong(optionValue.replace(".0", "").trim());
                                valEntity = optionValueById.get(valueId);

                                if (valEntity != null && valEntity.getOption().getId().equals(optEntity.getId())) {
                                    System.out.printf("Matched OptionValueEntity by ID: %d for option '%s'%n", valueId, optionNameRaw);
                                } else {
                                    valEntity = null; // ID found but wrong option
                                }
                            } catch (NumberFormatException ignored) {
                            }
                        }

                        if (valEntity == null) {
                            System.err.printf("Variant row %d unknown option value '%s' for option '%s'. Skipping this option value.%n", i, optionValueRaw, optionNameRaw);
                            continue;
                        } else {
                            System.out.printf("Found OptionValueEntity with id=%d for value='%s'%n", valEntity.getId(), optionValueRaw);
                        }

                        VariantOptionDTO vo = new VariantOptionDTO();
                        vo.setOptionName(optionNameRaw.trim());
                        vo.setValueName(optionValueRaw.trim());
                        vo.setOptionId(optEntity.getId());
                        vo.setOptionValueId(valEntity.getId());

                        optionList.add(vo);
                        System.out.println("Added to optionList: " + vo.getOptionName() + " = " + vo.getValueName());
                    }

                    variant.setOptions(optionList);
                    productMap.get(productName).getVariants().add(variant);

                    System.out.println("option list check : " + optionList);
                    System.out.printf("Parsed variant SKU '%s' for product '%s' with %d options.%n",
                            variant.getSku(), productName, optionList.size());

                } catch (Exception e) {
                    System.err.println("Error parsing variant sheet row " + i + ": " + e.getMessage());
                    e.printStackTrace();
                    throw e;
                }
            }

            // 4. Build Options from all variant options - deduplicated per product
            System.out.println("Building product options from variant options...");
            for (CreateProductRequestDTO dto : productMap.values()) {
                Set<Long> addedOptionIds = new HashSet<>();
                List<OptionDTO> options = new ArrayList<>();
                for (ProductVariantDTO variant : dto.getVariants()) {
                    for (VariantOptionDTO vo : variant.getOptions()) {
                        if (vo.getOptionId() != null && addedOptionIds.add(vo.getOptionId())) {
                            OptionDTO opt = new OptionDTO();
                            opt.setId(vo.getOptionId());
                            opt.setName(vo.getOptionName());
                            options.add(opt);
                        }
                    }
                }
                dto.setOptions(options);
            }

            System.out.println("Finished parsing all sheets successfully.");

        } catch (Exception e) {
            System.err.println("Fatal error while parsing Excel file: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to parse Excel file: " + e.getMessage(), e);
        }

        return new ArrayList<>(productMap.values());
    }

// Utility helper methods to safely get cell values

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                return String.valueOf(cell.getNumericCellValue()).trim();
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue()).trim();
            default:
                return cell.toString().trim();
        }
    }

    private Long getCellLong(Cell cell) {
        try {
            String val = getCellString(cell);
            if (val == null || val.isBlank()) return null;

            // Strip decimal part if it looks like a float
            if (val.contains(".")) {
                val = val.substring(0, val.indexOf("."));
            }

            return Long.parseLong(val.trim());
        } catch (Exception e) {
            System.err.println("Failed to parse long from: " + getCellString(cell));
            return null;
        }
    }


    private BigDecimal getCellDecimal(Cell cell) {
        try {
            String val = getCellString(cell);
            return (val != null && !val.isBlank()) ? new BigDecimal(val) : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getCellInt(Cell cell) {
        try {
            String val = getCellString(cell);
            if (val == null || val.isBlank()) return null;
            if (val.contains(".")) val = val.substring(0, val.indexOf("."));
            return Integer.parseInt(val.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private boolean parseBooleanSafe(String str, boolean def) {
        if (str == null) return def;
        return str.equalsIgnoreCase("true") || str.equals("1");
    }

    private int parseIntegerSafe(String str, int def) {
        try {
            return Integer.parseInt(str);
        } catch (Exception e) {
            return def;
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ProductDTO> getRelatedProducts(Long categoryId, Long productId) {
        List<ProductEntity> relatedProducts = productRepo.findTop10ByCategoryIdAndIdNotOrderByCreatedDateDesc(categoryId, productId);

        return relatedProducts.stream()
                .map(product -> mapper.map(product, ProductDTO.class))
                .collect(Collectors.toList());
    }

    private ProductImageDTO.ProductImageUpdateLogResult updateProductImages(
            List<ProductImageEntity> existingImages,
            ProductEntity product,
            List<ProductImageDTO> newImageDTOs) {

        System.out.println("Starting updateProductImages...");

        Set<String> incomingPaths = newImageDTOs.stream()
                .map(ProductImageDTO::getImgPath)
                .collect(Collectors.toSet());
        System.out.println("Incoming image paths: " + incomingPaths);

        Set<String> existingPaths = existingImages.stream()
                .map(ProductImageEntity::getImgPath)
                .collect(Collectors.toSet());
        System.out.println("Existing image paths: " + existingPaths);

        List<ProductImageDTO.ProductImageChange> removed = new ArrayList<>();
        List<ProductImageDTO.ProductImageChange> added = new ArrayList<>();
        List<ProductImageDTO.ProductImageChange> updated = new ArrayList<>();

        Map<String, ProductImageDTO> newImageMap = newImageDTOs.stream()
                .collect(Collectors.toMap(ProductImageDTO::getImgPath, dto -> dto));

        Iterator<ProductImageEntity> it = product.getProductImages().iterator();
        while (it.hasNext()) {
            ProductImageEntity existingImage = it.next();
            String imgPath = existingImage.getImgPath();

            if (!incomingPaths.contains(imgPath)) {
                System.out.println("Removing image: " + imgPath);
                it.remove();
                productImageRepo.delete(existingImage);

                removed.add(new ProductImageDTO.ProductImageChange(
                        existingImage.getId(),
                        "REMOVED",
                        existingImage.getImgPath(),
                        existingImage.getAltText(),
                        existingImage.getDisplayOrder(),
                        existingImage.isMainImageStatus(),
                        null // no old snapshot needed for removed
                ));
            } else {
                ProductImageDTO newDto = newImageMap.get(imgPath);

                if (newDto != null) {
                    // Capture old values BEFORE updating entity
                    Integer oldDisplayOrder = existingImage.getDisplayOrder();
                    Boolean oldMainStatus = existingImage.isMainImageStatus();
                    String oldAltText = existingImage.getAltText();
                    String oldImgPath = existingImage.getImgPath();

                    Integer newDisplayOrder = newDto.getDisplayOrder();
                    Boolean newMainStatus = Boolean.TRUE.equals(newDto.isMainImageStatus());
                    String newAltText = newDto.getAltText();

                    boolean updatedFlag = false;

                    if (!Objects.equals(oldDisplayOrder, newDisplayOrder)) {
                        System.out.println("Updating displayOrder for image: " + imgPath);
                        existingImage.setDisplayOrder(newDisplayOrder);
                        updatedFlag = true;
                    }

                    if (!Objects.equals(oldMainStatus, newMainStatus)) {
                        System.out.println("Updating mainImageStatus for image: " + imgPath);
                        existingImage.setMainImageStatus(newMainStatus);
                        updatedFlag = true;
                    }

                    if (!Objects.equals(oldAltText, newAltText)) {
                        System.out.println("Updating altText for image: " + imgPath);
                        existingImage.setAltText(newAltText);
                        updatedFlag = true;
                    }

                    if (updatedFlag) {
                        productImageRepo.save(existingImage);
                        System.out.println("Image updated and saved: " + imgPath);

                        updated.add(new ProductImageDTO.ProductImageChange(
                                existingImage.getId(),
                                "UPDATED",
                                existingImage.getImgPath(),
                                existingImage.getAltText(),
                                existingImage.getDisplayOrder(),
                                existingImage.isMainImageStatus(),
                                Map.of(
                                        "imgPath", oldImgPath,
                                        "altText", oldAltText,
                                        "displayOrder", oldDisplayOrder,
                                        "mainImageStatus", oldMainStatus
                                )
                        ));
                    } else {
                        System.out.println("No changes detected for image: " + imgPath);
                    }
                }
            }
        }

        for (ProductImageDTO dto : newImageDTOs) {
            if (!existingPaths.contains(dto.getImgPath())) {
                System.out.println("Adding new image: " + dto.getImgPath());
                ProductImageEntity newImg = new ProductImageEntity();
                newImg.setProduct(product);
                newImg.setImgPath(dto.getImgPath());
                newImg.setAltText(dto.getAltText());
                newImg.setDisplayOrder(dto.getDisplayOrder());
                newImg.setMainImageStatus(Boolean.TRUE.equals(dto.isMainImageStatus()));

                product.getProductImages().add(newImg);

                added.add(new ProductImageDTO.ProductImageChange(
                        dto.getId(),
                        "ADDED",
                        dto.getImgPath(),
                        dto.getAltText(),
                        dto.getDisplayOrder(),
                        dto.isMainImageStatus(),
                        null // no old snapshot for added
                ));
            }
        }

        System.out.println("Update finished. Added: " + added.size() + ", Removed: " + removed.size() + ", Updated: " + updated.size());

        return new ProductImageDTO.ProductImageUpdateLogResult(added, removed, updated);
    }

    // ----------------- AUDIT ------------------

    private void logProductImageChanges(ProductImageDTO.ProductImageUpdateLogResult changes, Long productId, UserEntity admin, HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");

        for (var removed : changes.removed()) {
            auditPublisher.publishEvent(new AuditEventDTO(
                    "UPDATE",
                    "ProductImage",
                    removed.id(), // <-- use actual image ID
                    Map.of(
                            "action", "REMOVE",
                            "productId", productId,
                            "imgPath", removed.imgPath(),
                            "altText", removed.altText(),
                            "displayOrder", removed.displayOrder(),
                            "mainImageStatus", removed.mainImage()
                    ),
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }

        for (var added : changes.added()) {
            auditPublisher.publishEvent(new AuditEventDTO(
                    "UPDATE",
                    "ProductImage",
                    added.id(), // <-- use actual image ID
                    Map.of(
                            "action", "ADD",
                            "productId", productId,
                            "imgPath", added.imgPath(),
                            "altText", added.altText(),
                            "displayOrder", added.displayOrder(),
                            "mainImageStatus", added.mainImage()
                    ),
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }

        for (var updated : changes.updated()) {
            Map<String, Object> oldMap = updated.oldSnapshot() != null ? updated.oldSnapshot() : Map.of();
            Map<String, Object> newMap = Map.of(
                    "imgPath", updated.imgPath(),
                    "altText", updated.altText(),
                    "displayOrder", updated.displayOrder(),
                    "mainImageStatus", updated.mainImage()
            );

            Map<String, Object> diff = AuditAspect.getDifferences(oldMap, newMap);
            if (diff.isEmpty()) continue;

            auditPublisher.publishEvent(new AuditEventDTO(
                    "UPDATE",
                    "ProductImage",
                    updated.id(), // <-- use actual image ID
                    Map.of(
                            "action", "UPDATE",
                            "productId", productId,
                            "changes", diff
                    ),
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }
    }

    private void logProductVariantChanges(ProductVariantDTO.ProductVariantUpdateLogResult changes, Long productId, UserEntity admin, HttpServletRequest request) {
        System.out.println("Logging product variant changes for productId=" + productId);

        String userAgent = request.getHeader("User-Agent");

        for (var added : changes.added()) {
            Map<String, Object> logData = createVariantLogMap("CREATE", productId, added);

            auditPublisher.publishEvent(new AuditEventDTO(
                    "CREATE",
                    "ProductVariant",
                    added.id(), // Use the variant ID here
                    logData,
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }

        for (var updated : changes.updated()) {
            Map<String, Object> oldMap = updated.oldSnapshot() != null ? updated.oldSnapshot() : Map.of();

            Map<String, Object> newMap = Map.of(
                    "sku", updated.sku(),
                    "stock", updated.stock(),
                    "imgPath", updated.imgPath(),
                    "price", updated.price(),
                    "options", updated.options()
            );

            Map<String, Object> diff = AuditAspect.getDifferences(oldMap, newMap);
            if (diff.isEmpty()) {
                System.out.println("No differences detected, skipping audit event.");
                continue;
            }

            Map<String, Object> logData = new HashMap<>();
            logData.put("action", "UPDATE");
            logData.put("productId", productId);
            logData.put("changes", diff);

            auditPublisher.publishEvent(new AuditEventDTO(
                    "UPDATE",
                    "ProductVariant",
                    updated.id(), // Correct variant ID
                    logData,
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }

        for (var removed : changes.removed()) {
            // Instead of hard delete, soft delete means delFg = 0
            Map<String, Object> logData = createVariantLogMap("SOFT_DELETE", productId, removed);

            auditPublisher.publishEvent(new AuditEventDTO(
                    "SOFT_DELETE",
                    "ProductVariant",
                    removed.id(),
                    logData,
                    admin.getId(),
                    admin.getName(),
                    admin.getRole().getName(),
                    null,
                    userAgent
            ));
        }

    }


    private Map<String, Object> createVariantLogMap(String action, Long productId, ProductVariantDTO.ProductVariantChange variant) {
        Map<String, Object> logData = new HashMap<>();
        logData.put("action", action);
        logData.put("productId", productId);
        logData.put("sku", variant.sku());
        logData.put("stock", variant.stock());
        logData.put("imgPath", variant.imgPath());
        logData.put("price", variant.price());

        List<Map<String, String>> optionList = variant.options().stream()
                .map(opt -> Map.of(
                        "optionName", opt.optionName(),
                        "valueName", opt.valueName()
                ))
                .toList();

        logData.put("options", optionList);

        return logData;
    }

    @Transactional
    public void softDeleteProduct(Long productId, UserEntity currentUser) {
        ProductEntity product = productRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));

        // Only proceed if not already soft deleted
        if (product.getDelFg() != 0) {
            Integer oldDelFg = product.getDelFg();

            product.setDelFg(0); // mark as deleted (soft delete)
            productRepo.save(product);

            // Prepare audit log data, including old and new delFg status
            Map<String, Object> auditData = new HashMap<>();
            auditData.put("delFg", Map.of("old", oldDelFg, "new", 0));

            auditPublisher.publishEvent(new AuditEventDTO(
                    "SOFT_DELETE",
                    "Product",
                    productId,
                    auditData,
                    currentUser.getId(),
                    currentUser.getName(),
                    currentUser.getRole().getName(),
                    null,
                    null // You can add userAgent if available
            ));
        }
    }

    @Transactional
    public void softDeleteVariant(Long variantId, UserEntity currentUser) {
        ProductVariantEntity variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        if (variant.getDelFg() != 0) {
            Integer oldDelFg = variant.getDelFg();

            variant.setDelFg(0);
            variantRepo.save(variant);

            Map<String, Object> auditData = new HashMap<>();
            auditData.put("delFg", Map.of("old", oldDelFg, "new", 0));

            auditPublisher.publishEvent(new AuditEventDTO(
                    "SOFT_DELETE",
                    "ProductVariant",
                    variantId,
                    auditData,
                    currentUser.getId(),
                    currentUser.getName(),
                    currentUser.getRole().getName(),
                    null,
                    null
            ));
        }
    }

    @Transactional
    public void restoreProduct(Long productId, UserEntity currentUser) {
        ProductEntity product = productRepo.findById(productId)
                .orElseThrow(() -> new NoSuchElementException("Product not found: " + productId));

        if (product.getDelFg() != 1) {
            Integer oldDelFg = product.getDelFg();

            product.setDelFg(1); // restore product
            productRepo.save(product);

            Map<String, Object> auditData = new HashMap<>();
            auditData.put("delFg", Map.of("old", oldDelFg, "new", 1));

            auditPublisher.publishEvent(new AuditEventDTO(
                    "RESTORE",
                    "Product",
                    productId,
                    auditData,
                    currentUser.getId(),
                    currentUser.getName(),
                    currentUser.getRole().getName(),
                    null,
                    null
            ));
        }
    }

    @Transactional
    public void restoreVariant(Long variantId, UserEntity currentUser) {
        ProductVariantEntity variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new NoSuchElementException("Variant not found: " + variantId));

        if (variant.getDelFg() != 1) {
            Integer oldDelFg = variant.getDelFg();

            variant.setDelFg(1); // restore variant
            variantRepo.save(variant);

            Map<String, Object> auditData = new HashMap<>();
            auditData.put("delFg", Map.of("old", oldDelFg, "new", 1));

            auditPublisher.publishEvent(new AuditEventDTO(
                    "RESTORE",
                    "ProductVariant",
                    variantId,
                    auditData,
                    currentUser.getId(),
                    currentUser.getName(),
                    currentUser.getRole().getName(),
                    null,
                    null
            ));
        }
    }

}
