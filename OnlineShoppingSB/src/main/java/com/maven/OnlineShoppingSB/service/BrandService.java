package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.BrandDTO;
import com.maven.OnlineShoppingSB.entity.BrandEntity;
import com.maven.OnlineShoppingSB.repository.BrandRepository;
import com.maven.OnlineShoppingSB.repository.BrandRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BrandService {

    @Autowired
    private BrandRepository repo;

    @Autowired
    private ModelMapper mapper;

    public BrandDTO insertBrand(BrandDTO dto) {
        // Check if a brand with the same name (case-insensitive) already exists (active or soft-deleted)
        BrandEntity existing = repo.findByNameIgnoreCase(dto.getName()).orElse(null);

        if (existing != null) {
            if (existing.getDelFg() == 0) {
                // Previously deleted — reactivate it
                existing.setDelFg(1);
                existing.setLogo(dto.getLogo());
                BrandEntity restored = repo.save(existing);

                return new BrandDTO(restored.getId(), restored.getName());
            } else {
                // Already exists and active
                throw new RuntimeException("Brand with this name already exists.");
            }
        }

        // Create new brand
        BrandEntity entity = new BrandEntity();
        entity.setName(dto.getName());
        entity.setLogo(dto.getLogo());
        entity.setDelFg(1);

        BrandEntity saved = repo.save(entity);
        return new BrandDTO(saved.getId(), saved.getName());
    }


    public List<BrandDTO> getAllBrands() {
        List<BrandEntity> brandList = repo.findByDelFg(1);
        return brandList.stream()
                .map(entity -> {
                    BrandDTO dto = new BrandDTO();
                    dto.setId(entity.getId());
                    dto.setName(entity.getName());
                    dto.setLogo(entity.getLogo());
                    return dto;
                })
                .collect(Collectors.toList());
    }


    public BrandDTO getById(Long id) {
        BrandEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("No brand found with id: " + id));

        BrandDTO dto = new BrandDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setLogo(entity.getLogo());
        return dto;
    }

    public BrandDTO updateBrand(BrandDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Brand ID must not be null for update");
        }

        BrandEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Brand not found"));

        // If name is not changed, just return
        if (existing.getName().equalsIgnoreCase(dto.getName())) {
            return new BrandDTO(existing.getId(), existing.getName());
        }

        // Check if the new name belongs to a soft-deleted brand
        BrandEntity duplicate = repo.findByNameIgnoreCase(dto.getName()).orElse(null);

        if (duplicate != null) {
            if (duplicate.getDelFg() == 0) {
                // Restore the soft-deleted brand
                duplicate.setDelFg(1);
                BrandEntity restored = repo.save(duplicate);

                // Optionally delete the current brand (or merge)
                existing.setDelFg(0);
                repo.save(existing);

                return new BrandDTO(restored.getId(), restored.getName());
            } else {
                throw new RuntimeException("A brand with this name already exists.");
            }
        }

        existing.setName(dto.getName());
        BrandEntity updated = repo.save(existing);
        return new BrandDTO(updated.getId(), updated.getName());
    }


    public void deleteBrand(Long id) {
        BrandEntity existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));

        existing.setDelFg(0);
        repo.save(existing);
    }

}
