package com.maven.OnlineShoppingSB.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import jakarta.transaction.Transactional;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
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
    private ProductVariantRepository variantRepo;
    @Autowired
    private ModelMapper mapper;
    @Autowired
    private CloudinaryService cloudService;

    @Transactional
    public ProductEntity createProduct(CreateProductRequestDTO request) {
        ProductDTO dto = request.getProduct();

        BrandEntity brand = findBrandById(dto.getBrandId());
        CategoryEntity category = findCategoryById(dto.getCategoryId());

        ProductEntity product = new ProductEntity();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setBasePrice(dto.getBasePrice());

        product = productRepo.save(product); // Save early for foreign keys

        if (request.getOptions() != null) {
            addProductOptions(product, request.getOptions());
        }
        if (request.getVariants() != null) {
            addProductVariants(product, request.getVariants());
        }
        if (request.getProductImages() != null) {
            addProductImages(product, request.getProductImages());
        }

        return product;
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

    private void addProductOptions(ProductEntity product, List<OptionDTO> options) {
        for (OptionDTO optionDto : options) {
            OptionEntity option = findOptionById(optionDto.getId());

            ProductOptionEntity productOption = new ProductOptionEntity();
            productOption.setProduct(product);
            productOption.setOption(option);

            product.getOptions().add(productOption);
        }
    }

    private void addProductVariants(ProductEntity product, List<ProductVariantDTO> variantDTOs) {
        for (ProductVariantDTO variantDto : variantDTOs) {
            ProductVariantEntity variant = new ProductVariantEntity();
            variant.setProduct(product);
            variant.setStock(variantDto.getStock());
            variant.setSku(variantDto.getSku());
            variant.setImgPath(variantDto.getImgPath());

            if (variantDto.getOptions() != null) {
                for (VariantOptionDTO opt : variantDto.getOptions()) {
                    OptionEntity option = findOptionById(opt.getOptionId());

                    OptionValueEntity value = optionValueRepo.findByOptionAndId(option, opt.getOptionValueId())
                            .orElseThrow(() -> new RuntimeException("OptionValue not found: ValueName=" + opt.getValueName() + " OptionName=" + opt.getOptionName()));

                    VariantOptionValueEntity variantOptVal = new VariantOptionValueEntity();
                    variantOptVal.setVariant(variant);
                    variantOptVal.setOptionValue(value);

                    variant.getVariantOptionValues().add(variantOptVal);
                }
            }

            VariantPriceEntity priceEntity = new VariantPriceEntity();
            priceEntity.setVariant(variant);
            priceEntity.setPrice(variantDto.getPrice());
            priceEntity.setStartDate(LocalDateTime.now());

            variant.getPrices().add(priceEntity);
            product.getVariants().add(variant);
        }
    }

    private void addProductImages(ProductEntity product, List<ProductImageDTO> imageDTOs) {
        for (ProductImageDTO imageDto : imageDTOs) {
            ProductImageEntity image = new ProductImageEntity();
            image.setProduct(product);
            image.setImgPath(imageDto.getImgPath());
            image.setDisplayOrder(imageDto.getDisplayOrder());
            image.setAltText(imageDto.getAltText());
            image.setMainImageStatus(Boolean.TRUE.equals(imageDto.isMainImageStatus()));

            product.getProductImages().add(image);
        }
    }

    public List<ProductListItemDTO> getAllProducts() {
        List<ProductEntity> products = productRepo.findAll(Sort.by(Sort.Direction.DESC, "createdDate"));
        return products.stream()
                .map(this::mapToProductListItemDTO)
                .collect(Collectors.toList());
    }

    public ProductListItemDTO getProductById(Long id) {
        ProductEntity product = productRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Product not found with id: " + id));
        return mapToProductListItemDTO(product);
    }

    private ProductListItemDTO mapToProductListItemDTO(ProductEntity product) {
        ProductDTO productDTO = mapper.map(product, ProductDTO.class);
        BrandDTO brandDTO = mapper.map(product.getBrand(), BrandDTO.class);
        CategoryDTO categoryDTO = mapper.map(product.getCategory(), CategoryDTO.class);

        List<ProductVariantDTO> variants = variantRepo.findByProductId(product.getId()).stream()
                .map(variant -> {
                    ProductVariantDTO dto = new ProductVariantDTO();
                    dto.setId(variant.getId());
                    dto.setSku(variant.getSku());
                    dto.setImgPath(variant.getImgPath());
                    dto.setStock(variant.getStock());

                    LocalDateTime now = LocalDateTime.now();
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
                            .map(vov -> {
                                OptionValueEntity val = vov.getOptionValue();
                                OptionEntity opt = val.getOption();

                                VariantOptionDTO optDTO = new VariantOptionDTO();
                                optDTO.setOptionId(opt.getId());
                                optDTO.setOptionName(opt.getName());
                                optDTO.setOptionValueId(val.getId());
                                optDTO.setValueName(val.getValue());

                                return optDTO;
                            }).collect(Collectors.toList()));

                    return dto;
                }).collect(Collectors.toList());

        List<ProductOptionDTO> options = productOptionRepo.findByProduct(product).stream()
                .map(po -> {
                    OptionEntity option = po.getOption();

                    List<OptionValueEntity> usedOptionValues = product.getVariants().stream()
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

    // Provide Excel template as InputStreamResource
    public InputStreamResource getExcelTemplate() throws IOException {
        InputStream is = new ClassPathResource("templates/product_upload_template.xlsx").getInputStream();
        return new InputStreamResource(is);
    }

    // Process uploaded ZIP file (Excel + images)

    @Transactional
    public void processZipFile(MultipartFile zipFile) throws IOException {
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
            createProduct(productDTO);
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

//    private Boolean getCellBoolean(Cell cell) {
//        if (cell == null) return null;
//        if (cell.getCellType() == CellType.BOOLEAN) {
//            return cell.getBooleanCellValue();
//        } else if (cell.getCellType() == CellType.STRING) {
//            return Boolean.parseBoolean(cell.getStringCellValue().trim());
//        }
//        return null;
//    }
}
