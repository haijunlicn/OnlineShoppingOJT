package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.maven.OnlineShoppingSB.dto.OptionDTO;
import com.maven.OnlineShoppingSB.entity.CategoryOptionEntity;
import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.repository.CategoryOptionRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.CategoryDTO;
import com.maven.OnlineShoppingSB.entity.CategoryEntity;
import com.maven.OnlineShoppingSB.repository.CategoryRepository;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository repo;

    @Autowired
    private CategoryOptionRepository cateOptionRepo;

    @Autowired
    private ModelMapper mapper;

//    public CategoryDTO insertCategory(CategoryDTO dto) {
//        CategoryEntity entity = new CategoryEntity();
//        entity.setName(dto.getName());
//        // entity.setDelFg(false);
//
//        if (dto.getParentCategoryId() != null) {
//            CategoryEntity parent = repo.findById(dto.getParentCategoryId())
//                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
//            entity.setParentCategory(parent);
//        }
//
//        CategoryEntity saved = repo.save(entity);
//
//        CategoryDTO resultDto = new CategoryDTO();
//        resultDto.setId(saved.getId());
//        resultDto.setName(saved.getName());
//        resultDto.setParentCategoryId(
//            saved.getParentCategory() != null ? saved.getParentCategory().getId() : null
//        );
//
//        return resultDto;
//    }

    public CategoryDTO insertCategory(CategoryDTO dto) {
        CategoryEntity parent = null;
        if (dto.getParentCategoryId() != null) {
            parent = repo.findById(dto.getParentCategoryId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
        }

        // Check if ACTIVE category with same name + parent exists
        boolean activeExists = repo.existsByNameAndParentCategoryIdAndDelFg(
                dto.getName(), dto.getParentCategoryId(), 1);
        if (activeExists) {
            throw new RuntimeException("Active category with the same name already exists under this parent.");
        }

        // Check if SOFT-DELETED category exists to reuse
        Optional<CategoryEntity> softDeletedOpt = repo.findByNameAndParentCategoryIdAndDelFg(
                dto.getName(), dto.getParentCategoryId(), 0);

        CategoryEntity entity;
        if (softDeletedOpt.isPresent()) {
            // Reactivate soft-deleted category
            entity = softDeletedOpt.get();
            entity.setDelFg(1);
            // Update name or any other fields if needed
            entity.setName(dto.getName());
            entity.setParentCategory(parent);
        } else {
            // Create new category entity
            entity = new CategoryEntity();
            entity.setName(dto.getName());
            entity.setParentCategory(parent);
            entity.setDelFg(1);
        }

        CategoryEntity saved = repo.save(entity);

        CategoryDTO resultDto = new CategoryDTO();
        resultDto.setId(saved.getId());
        resultDto.setName(saved.getName());
        resultDto.setParentCategoryId(
                saved.getParentCategory() != null ? saved.getParentCategory().getId() : null
        );

        return resultDto;
    }


    public List<CategoryDTO> getAllCategories() {
        List<CategoryEntity> cateList = repo.findByDelFg(1);
        return cateList.stream()
                .map(entity -> {
                    CategoryDTO dto = new CategoryDTO();
                    dto.setId(entity.getId());
                    dto.setName(entity.getName());
                    dto.setParentCategoryId(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
                    dto.setParentCategoryName(entity.getParentCategory() != null ? entity.getParentCategory().getName() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<CategoryDTO> getAllCategoriesWithOptions() {
        List<CategoryEntity> categories = repo.findByDelFg(1);

        return categories.stream()
                .map(category -> {
                    CategoryDTO dto = new CategoryDTO();
                    dto.setId(category.getId());
                    dto.setName(category.getName());
                    dto.setParentCategoryId(category.getParentCategory() != null ? category.getParentCategory().getId() : null);
                    dto.setParentCategoryName(category.getParentCategory() != null ? category.getParentCategory().getName() : null);

                    // Set optionTypes
                    List<CategoryOptionEntity> categoryOptions = cateOptionRepo.findByCategoryIdAndDelFg(category.getId(), 1);
                    List<OptionDTO> optionDTOs = categoryOptions.stream()
                            .map(catOpt -> mapper.map(catOpt.getOption(), OptionDTO.class))
                            .collect(Collectors.toList());

//                    List<OptionDTO> optionDTOs = categoryOptions.stream()
//                            .map(catOpt -> {
//                                OptionEntity opt = catOpt.getOption();
//                                OptionDTO optDTO = new OptionDTO();
//                                optDTO.setId(opt.getId());
//                                optDTO.setName(opt.getName());
//                                // Optional: fetch and set option values
//                                // optDTO.setOptionValues(...);
//                                return optDTO;
//                            })
//                            .collect(Collectors.toList());

                    dto.setOptionTypes(optionDTOs);
                    return dto;
                })
                .collect(Collectors.toList());
    }


    public CategoryDTO getById(Long id) {
        CategoryEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("No category found with id: " + id));

        CategoryDTO dto = new CategoryDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        if (entity.getParentCategory() != null) {
            dto.setParentCategoryId(entity.getParentCategory().getId());
        }

        return dto;
    }

    public CategoryDTO updateCategory(CategoryDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Category ID must not be null for update");
        }

        CategoryEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        existing.setName(dto.getName());

        if (dto.getParentCategoryId() != null) {
            CategoryEntity parent = repo.findById(dto.getParentCategoryId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            existing.setParentCategory(parent);
        } else {
            existing.setParentCategory(null);
        }

        CategoryEntity updated = repo.save(existing);

        CategoryDTO updatedDto = new CategoryDTO();
        updatedDto.setId(updated.getId());
        updatedDto.setName(updated.getName());
        updatedDto.setParentCategoryId(
                updated.getParentCategory() != null ? updated.getParentCategory().getId() : null
        );

        return updatedDto;
    }

    public void deleteCategory(Long id) {
        CategoryEntity existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));

        existing.setDelFg(0);
        repo.save(existing);
    }


}
