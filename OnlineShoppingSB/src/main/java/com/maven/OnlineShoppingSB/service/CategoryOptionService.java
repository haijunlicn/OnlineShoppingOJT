package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.CategoryOptionDTO;
import com.maven.OnlineShoppingSB.entity.CategoryEntity;
import com.maven.OnlineShoppingSB.entity.CategoryOptionEntity;
import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.repository.CategoryOptionRepository;
import com.maven.OnlineShoppingSB.repository.CategoryRepository;
import com.maven.OnlineShoppingSB.repository.OptionRepository;

@Service
public class CategoryOptionService {

    @Autowired
    private CategoryOptionRepository repo;

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private OptionRepository optionRepo;

    public CategoryOptionDTO insert(CategoryOptionDTO dto) {
        CategoryEntity category = categoryRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));

        OptionEntity option = optionRepo.findById(dto.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        CategoryOptionEntity entity = new CategoryOptionEntity();
        entity.setCategory(category);
        entity.setOption(option);
        entity.setDelFg(dto.getDelFg());

        CategoryOptionEntity saved = repo.save(entity);
        return convertToDTO(saved);
    }

    public List<CategoryOptionDTO> getAllCategoryOptions() {
        List<CategoryOptionEntity> list = repo.findAll();
        return list.stream().map(entity -> {
            CategoryOptionDTO dto = new CategoryOptionDTO();
            dto.setId(entity.getId());
            dto.setCategoryId(entity.getCategory().getId());
            dto.setCategoryName(entity.getCategory().getName());
            dto.setOptionId(entity.getOption().getId());
            dto.setOptionName(entity.getOption().getName());
            dto.setDelFg(entity.getDelFg());
            return dto;
        }).collect(Collectors.toList());
    }


    public CategoryOptionDTO getById(Long id) {
        CategoryOptionEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("CategoryOption not found with id: " + id));
        return convertToDTO(entity);
    }

    public CategoryOptionDTO update(CategoryOptionDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("ID must not be null for update");
        }

        CategoryOptionEntity entity = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("CategoryOption not found"));

        CategoryEntity category = categoryRepo.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
        OptionEntity option = optionRepo.findById(dto.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        entity.setCategory(category);
        entity.setOption(option);
        entity.setDelFg(dto.getDelFg());

        CategoryOptionEntity updated = repo.save(entity);
        return convertToDTO(updated);
    }

    public void delete(Long id) {
        CategoryOptionEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("CategoryOption not found"));
        entity.setDelFg(0);
        repo.save(entity);
    }

    private CategoryOptionDTO convertToDTO(CategoryOptionEntity entity) {
        CategoryOptionDTO dto = new CategoryOptionDTO();
        dto.setId(entity.getId());
        dto.setCategoryId(entity.getCategory().getId());
        dto.setOptionId(entity.getOption().getId());
        dto.setDelFg(entity.getDelFg());
        return dto;
    }

    public void assignOptionsToCategory(Long categoryId, List<CategoryOptionDTO> options) {
        CategoryEntity category = categoryRepo.findById(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        // Optional: clear previous assignments
        List<CategoryOptionEntity> existing = repo.findByCategoryId(categoryId);
        repo.deleteAll(existing); // OR use soft delete: setDelFg(0) and saveAll

        // Insert new assignments
        List<CategoryOptionEntity> newEntities = options.stream().map(dto -> {
            OptionEntity option = optionRepo.findById(dto.getOptionId())
                    .orElseThrow(() -> new RuntimeException("Option not found: " + dto.getOptionId()));

            CategoryOptionEntity entity = new CategoryOptionEntity();
            entity.setCategory(category);
            entity.setOption(option);
            entity.setDelFg(1); // active
            return entity;
        }).collect(Collectors.toList());

        repo.saveAll(newEntities);
    }

}
