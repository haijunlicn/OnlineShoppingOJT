package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import jakarta.transaction.Transactional;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
    private  ProductOptionRepository productOptionRepo;

    @Autowired
    private ProductVariantRepository variantRepo;

    @Autowired
    private ModelMapper mapper;

    @Transactional
    public ProductEntity createProduct(CreateProductRequestDTO request) {
        ProductDTO dto = request.getProduct();

        BrandEntity brand = brandRepo.findById(dto.getBrandId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        CategoryEntity category = cateRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        ProductEntity product = new ProductEntity();
        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setBrand(brand);
        product.setCategory(category);
        product.setBasePrice(dto.getBasePrice());

        // Save product early to attach it (optional but safe)
        product = productRepo.save(product);

        // Save Options
        for (OptionDTO optionDto : request.getOptions()) {
            OptionEntity option = optionRepo.findById(optionDto.getId())
                    .orElseThrow(() -> new RuntimeException("Option not found"));

            ProductOptionEntity productOption = new ProductOptionEntity();
            productOption.setProduct(product);
            productOption.setOption(option);
            product.getOptions().add(productOption);
        }

        // Save Variants
        for (ProductVariantDTO variantDto : request.getVariants()) {
            ProductVariantEntity variant = new ProductVariantEntity();
            variant.setProduct(product);
            variant.setStock(variantDto.getStock());
            variant.setSku(variantDto.getSku());

            for (VariantOptionDTO opt : variantDto.getOptions()) {

                System.out.println("the opt : " + opt);

                OptionEntity option = optionRepo.findById(opt.getOptionId())
                        .orElseThrow(() -> new RuntimeException("Option '" + opt.getOptionName() + "' not found"));

                OptionValueEntity value = optionValueRepo
                        .findByOptionAndId(option, opt.getOptionValueId())
                        .orElseThrow(() -> new RuntimeException("Value '" + opt.getValueName() + "' not found in option " + opt.getOptionName()));

                VariantOptionValueEntity variantOptVal = new VariantOptionValueEntity();
                variantOptVal.setVariant(variant);
                variantOptVal.setOptionValue(value);
                variant.getVariantOptionValues().add(variantOptVal);
            }

            VariantPriceEntity priceEntity = new VariantPriceEntity();
            priceEntity.setVariant(variant);
            priceEntity.setPrice(variantDto.getPrice());
            priceEntity.setStartDate(LocalDateTime.now());
            priceEntity.setEndDate(null);
            variant.getPrices().add(priceEntity);

            product.getVariants().add(variant);
        }
        return product;
    }

    public List<ProductListItemDTO> getAllProducts() {
        // List<ProductEntity> products = productRepo.findAll();

        List<ProductEntity> products = productRepo.findAll(Sort.by(Sort.Direction.DESC, "createdDate"));
        return products.stream().map(product -> {
            ProductDTO productDTO = mapper.map(product, ProductDTO.class);

            BrandDTO brandDTO = mapper.map(product.getBrand(), BrandDTO.class);
            CategoryDTO categoryDTO = mapper.map(product.getCategory(), CategoryDTO.class);

            List<ProductVariantDTO> variants = variantRepo.findByProductId(product.getId()).stream()
                    .map(variant -> mapper.map(variant, ProductVariantDTO.class))
                    .collect(Collectors.toList());

            List<ProductOptionDTO> options = productOptionRepo.findByProduct(product).stream()
                    .map(productOptionEntity -> mapper.map(productOptionEntity.getOption(), ProductOptionDTO.class))
                    .collect(Collectors.toList());

            ProductListItemDTO item = new ProductListItemDTO();
            item.setProduct(productDTO);
            item.setBrand(brandDTO);
            item.setCategory(categoryDTO);
            item.setVariants(variants);
            item.setOptions(options);

            return item;
        }).collect(Collectors.toList());
    }

}
