package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import com.maven.OnlineShoppingSB.dto.OptionDTO;
import com.maven.OnlineShoppingSB.entity.CategoryOptionEntity;
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
            entity.setImgPath(dto.getImgPath());
            entity.setName(dto.getName());
            entity.setParentCategory(parent);
        } else {
            // Create new category entity
            entity = new CategoryEntity();
            entity.setName(dto.getName());
            entity.setParentCategory(parent);
            entity.setImgPath(dto.getImgPath());
            entity.setDelFg(1);
        }

        CategoryEntity saved = repo.save(entity);

        CategoryDTO resultDto = new CategoryDTO();
        resultDto.setId(saved.getId());
        resultDto.setName(saved.getName());
        resultDto.setImgPath(saved.getImgPath());
        resultDto.setParentCategoryId(
                saved.getParentCategory() != null ? saved.getParentCategory().getId() : null
        );

        return resultDto;
    }


    public List<CategoryDTO> getAllCategories() {
        List<CategoryEntity> cateList = repo.findByDelFg(1);
        // System.out.println("cate entity list : " + cateList);
        return cateList.stream()
                .map(entity -> {
                    CategoryDTO dto = new CategoryDTO();
                    dto.setId(entity.getId());
                    dto.setName(entity.getName());
                    dto.setParentCategoryId(entity.getParentCategory() != null ? entity.getParentCategory().getId() : null);
                    dto.setParentCategoryName(entity.getParentCategory() != null ? entity.getParentCategory().getName() : null);
                    dto.setImgPath(entity.getImgPath());
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
                    dto.setImgPath(category.getImgPath());
                    // Set optionTypes
                    List<CategoryOptionEntity> categoryOptions = cateOptionRepo.findByCategoryIdAndDelFg(category.getId(), 1);
                    List<OptionDTO> optionDTOs = categoryOptions.stream()
                            .map(catOpt -> mapper.map(catOpt.getOption(), OptionDTO.class))
                            .collect(Collectors.toList());
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
        existing.setImgPath(dto.getImgPath());

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
        updatedDto.setImgPath(updated.getImgPath());
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

    public List<CategoryDTO> getTopCategoriesByOrderData() {
        try {
            // Get all categories with product counts
            List<Object[]> allCategoriesData = repo.findAllCategoriesWithProductCounts();
            
            // Convert to CategoryDTO list
            List<CategoryDTO> allCategories = allCategoriesData.stream()
                    .map(data -> {
                        CategoryDTO dto = new CategoryDTO();
                        
                        // Safe casting for ID
                        Object idObj = data[0];
                        if (idObj instanceof Integer) {
                            dto.setId(((Integer) idObj).longValue());
                        } else if (idObj instanceof Long) {
                            dto.setId((Long) idObj);
                        } else {
                            dto.setId(0L);
                        }
                        
                        dto.setName((String) data[1]);
                        dto.setImgPath((String) data[2]);
                        
                        // Safe casting for parent category ID
                        Object parentIdObj = data[3];
                        if (parentIdObj instanceof Integer) {
                            dto.setParentCategoryId(((Integer) parentIdObj).longValue());
                        } else if (parentIdObj instanceof Long) {
                            dto.setParentCategoryId((Long) parentIdObj);
                        } else {
                            dto.setParentCategoryId(null);
                        }
                        
                        dto.setParentCategoryName((String) data[4]);
                        
                        // Handle Integer from MySQL COUNT function
                        Object productCountObj = data[5];
                        if (productCountObj instanceof Integer) {
                            dto.setProductCount(((Integer) productCountObj).longValue());
                        } else if (productCountObj instanceof Long) {
                            dto.setProductCount((Long) productCountObj);
                        } else {
                            dto.setProductCount(0L);
                        }
                        
                        return dto;
                    })
                    .collect(Collectors.toList());
            
            // Get order data for each category
            Map<Long, Long> categoryOrderCounts = getCategoryOrderCounts();
            
            // Calculate scores for each category
            List<CategoryScore> categoryScores = new ArrayList<>();
            
            for (CategoryDTO category : allCategories) {
                Long orderCount = categoryOrderCounts.getOrDefault(category.getId(), 0L);
                Long score = orderCount;
                
                // If this is a child category (has parent), add parent's score
                if (category.getParentCategoryId() != null) {
                    Long parentOrderCount = categoryOrderCounts.getOrDefault(category.getParentCategoryId(), 0L);
                    score += parentOrderCount;
                }
                
                categoryScores.add(new CategoryScore(category, score));
            }
            
            // Sort by score (order count) descending and get top 5
            return categoryScores.stream()
                    .sorted((a, b) -> Long.compare(b.score, a.score))
                    .limit(5)
                    .map(cs -> cs.category)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            System.err.println("Error getting top categories: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    private Map<Long, Long> getCategoryOrderCounts() {
        // Get order counts for each category
        List<Object[]> orderCounts = repo.findCategoryOrderCounts();
        
        Map<Long, Long> categoryOrderCounts = new HashMap<>();
        for (Object[] data : orderCounts) {
            // Safe casting for category ID
            Object categoryIdObj = data[0];
            Long categoryId;
            if (categoryIdObj instanceof Integer) {
                categoryId = ((Integer) categoryIdObj).longValue();
            } else if (categoryIdObj instanceof Long) {
                categoryId = (Long) categoryIdObj;
            } else {
                categoryId = 0L;
            }
            
            // Handle Integer from MySQL COUNT function
            Object orderCountObj = data[1];
            Long orderCount;
            if (orderCountObj instanceof Integer) {
                orderCount = ((Integer) orderCountObj).longValue();
            } else if (orderCountObj instanceof Long) {
                orderCount = (Long) orderCountObj;
            } else {
                orderCount = 0L;
            }
            
            categoryOrderCounts.put(categoryId, orderCount);
        }
        
        return categoryOrderCounts;
    }
    
    // Helper class to hold category and its score
    private static class CategoryScore {
        CategoryDTO category;
        Long score;
        
        CategoryScore(CategoryDTO category, Long score) {
            this.category = category;
            this.score = score;
        }
    }


}
