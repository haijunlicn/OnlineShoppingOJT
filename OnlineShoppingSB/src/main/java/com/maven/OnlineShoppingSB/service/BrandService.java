package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.BrandDTO;
import com.maven.OnlineShoppingSB.entity.BrandEntity;
import com.maven.OnlineShoppingSB.repository.BrandRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BrandService {

    @Autowired
    private BrandRepository repo;

    public BrandDTO insertBrand(BrandDTO dto) {
        // Find active brands with the same name
        List<BrandEntity> activeBrandsByName = repo.findByNameIgnoreCaseAndDelFg(dto.getName(), 1);
        if (!activeBrandsByName.isEmpty()) {
            throw new RuntimeException("Brand name already exists.");
        }

        // Find active brands with the same baseSku
        List<BrandEntity> activeBrandsBySku = repo.findByBaseSkuIgnoreCaseAndDelFg(dto.getBaseSku(), 1);
        if (!activeBrandsBySku.isEmpty()) {
            throw new RuntimeException("Base SKU '" + dto.getBaseSku() + "' already exists.");
        }

        // Check if any soft deleted brand exists to restore by name (delFg=0)
        List<BrandEntity> softDeletedBrandsByName = repo.findByNameIgnoreCaseAndDelFg(dto.getName(), 0);
        if (!softDeletedBrandsByName.isEmpty()) {
            BrandEntity softDeleted = softDeletedBrandsByName.get(0);
            softDeleted.setDelFg(1);
            softDeleted.setLogo(dto.getLogo());
            softDeleted.setBaseSku(dto.getBaseSku());
            BrandEntity restored = repo.save(softDeleted);
            return convertToDTO(restored);
        }

        BrandEntity newBrand = new BrandEntity();
        newBrand.setName(dto.getName());
        newBrand.setLogo(dto.getLogo());
        newBrand.setBaseSku(dto.getBaseSku());
        newBrand.setDelFg(1);

        BrandEntity saved = repo.save(newBrand);
        return convertToDTO(saved);
    }

    public List<BrandDTO> getAllBrands() {
        return repo.findByDelFg(1)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public BrandDTO getById(Long id) {
        BrandEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));
        return convertToDTO(entity);
    }

    public BrandDTO updateBrand(BrandDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Brand ID is required for update.");
        }

        BrandEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Brand not found."));

        // Handle brand name changes and potential duplication
        if (!existing.getName().equalsIgnoreCase(dto.getName())) {
            List<BrandEntity> duplicates = repo.findByNameIgnoreCaseAndDelFg(dto.getName(), 1);
            boolean hasConflict = duplicates.stream()
                    .anyMatch(b -> !b.getId().equals(existing.getId()));

            if (hasConflict) {
                // Check if conflict is a soft deleted brand to restore
                List<BrandEntity> softDeletedDuplicates = repo.findByNameIgnoreCaseAndDelFg(dto.getName(), 0);
                if (!softDeletedDuplicates.isEmpty()) {
                    BrandEntity duplicate = softDeletedDuplicates.get(0);
                    duplicate.setDelFg(1);
                    duplicate.setLogo(dto.getLogo());
                    duplicate.setBaseSku(dto.getBaseSku());
                    BrandEntity restored = repo.save(duplicate);

                    existing.setDelFg(0);
                    repo.save(existing);

                    return convertToDTO(restored);
                } else {
                    throw new RuntimeException("A brand with this name already exists.");
                }
            }
            existing.setName(dto.getName());
        }

        // Check for baseSku duplication
        if (dto.getBaseSku() != null && !dto.getBaseSku().equalsIgnoreCase(existing.getBaseSku())) {
            List<BrandEntity> skuConflicts = repo.findByBaseSkuIgnoreCaseAndDelFg(dto.getBaseSku(), 1);
            boolean skuConflictExists = skuConflicts.stream()
                    .anyMatch(b -> !b.getId().equals(existing.getId()));

            if (skuConflictExists) {
                throw new RuntimeException("A brand with this Base SKU already exists.");
            }
            existing.setBaseSku(dto.getBaseSku());
        }

        // Update logo if provided
        if (dto.getLogo() != null) {
            existing.setLogo(dto.getLogo());
        }

        BrandEntity updated = repo.save(existing);
        return convertToDTO(updated);
    }

//    public BrandDTO updateBrand(BrandDTO dto) {
//        if (dto.getId() == null) {
//            throw new IllegalArgumentException("Brand ID is required for update.");
//        }
//
//        BrandEntity existing = repo.findById(dto.getId())
//                .orElseThrow(() -> new RuntimeException("Brand not found."));
//
//        if (!existing.getName().equalsIgnoreCase(dto.getName())) {
//            Optional<BrandEntity> optionalDuplicate = repo.findByNameIgnoreCase(dto.getName());
//            if (optionalDuplicate.isPresent()) {
//                BrandEntity duplicate = optionalDuplicate.get();
//                if (duplicate.getDelFg() == 0) {
//                    // Restore soft-deleted brand
//                    duplicate.setDelFg(1);
//                    duplicate.setLogo(dto.getLogo());
//                    BrandEntity restored = repo.save(duplicate);
//
//                    // Soft delete the current one
//                    existing.setDelFg(0);
//                    repo.save(existing);
//
//                    return convertToDTO(restored);
//                } else {
//                    throw new RuntimeException("A brand with this name already exists.");
//                }
//            }
//
//            existing.setName(dto.getName());
//        }
//
//        if (dto.getLogo() != null) {
//            existing.setLogo(dto.getLogo());
//        }
//
//        BrandEntity updated = repo.save(existing);
//        return convertToDTO(updated);
//    }

    public void deleteBrand(Long id) {
        BrandEntity existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));

        existing.setDelFg(0); // soft delete
        repo.save(existing);
    }

    private BrandDTO convertToDTO(BrandEntity entity) {
        BrandDTO dto = new BrandDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setLogo(entity.getLogo());
        dto.setBaseSku(entity.getBaseSku()); // ✅ baseSku mapping
        dto.setDelFg(entity.getDelFg());
        if (entity.getCreatedDate() != null)
            dto.setCreatedDate(entity.getCreatedDate().toString());
        if (entity.getUpdatedDate() != null)
            dto.setUpdatedDate(entity.getUpdatedDate().toString());
        return dto;
    }

}
