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
        Optional<BrandEntity> optionalBrand = repo.findByNameIgnoreCase(dto.getName());

        if (optionalBrand.isPresent()) {
            BrandEntity existing = optionalBrand.get();
            if (existing.getDelFg() == 0) {
                // Reactivate soft-deleted brand
                existing.setDelFg(1);
                existing.setLogo(dto.getLogo());
                BrandEntity restored = repo.save(existing);
                return convertToDTO(restored);
            } else {
                throw new RuntimeException("Brand with this name already exists.");
            }
        }

        BrandEntity newBrand = new BrandEntity();
        newBrand.setName(dto.getName());
        newBrand.setLogo(dto.getLogo());
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

        if (!existing.getName().equalsIgnoreCase(dto.getName())) {
            Optional<BrandEntity> optionalDuplicate = repo.findByNameIgnoreCase(dto.getName());
            if (optionalDuplicate.isPresent()) {
                BrandEntity duplicate = optionalDuplicate.get();
                if (duplicate.getDelFg() == 0) {
                    // Restore soft-deleted brand
                    duplicate.setDelFg(1);
                    duplicate.setLogo(dto.getLogo());
                    BrandEntity restored = repo.save(duplicate);

                    // Soft delete the current one
                    existing.setDelFg(0);
                    repo.save(existing);

                    return convertToDTO(restored);
                } else {
                    throw new RuntimeException("A brand with this name already exists.");
                }
            }

            existing.setName(dto.getName());
        }

        if (dto.getLogo() != null) {
            existing.setLogo(dto.getLogo());
        }

        BrandEntity updated = repo.save(existing);
        return convertToDTO(updated);
    }

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
        dto.setDelFg(entity.getDelFg());
        if (entity.getCreatedDate() != null)
            dto.setCreatedDate(entity.getCreatedDate().toString());
        if (entity.getUpdatedDate() != null)
            dto.setUpdatedDate(entity.getUpdatedDate().toString());
        return dto;
    }
}
