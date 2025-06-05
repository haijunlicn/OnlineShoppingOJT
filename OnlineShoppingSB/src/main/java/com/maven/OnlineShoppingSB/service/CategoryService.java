package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.stream.Collectors;

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
    private ModelMapper mapper;

    public CategoryDTO insertCategory(CategoryDTO dto) {
        CategoryEntity entity = new CategoryEntity();
        entity.setName(dto.getName());
        // entity.setDelFg(false);

        if (dto.getParentCategoryId() != null) {
            CategoryEntity parent = repo.findById(dto.getParentCategoryId())
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
            entity.setParentCategory(parent);
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
