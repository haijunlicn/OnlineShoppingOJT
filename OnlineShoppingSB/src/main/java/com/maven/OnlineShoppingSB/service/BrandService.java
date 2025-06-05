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
        BrandEntity entity = new BrandEntity();
        entity.setName(dto.getName());
        BrandEntity saved = repo.save(entity);

        BrandDTO resultDto = new BrandDTO();
        resultDto.setId(saved.getId());
        resultDto.setName(saved.getName());
        return resultDto;
    }

    public List<BrandDTO> getAllBrands() {
        List<BrandEntity> brandList = repo.findByDelFg(1);
        return brandList.stream()
                .map(entity -> {
                    BrandDTO dto = new BrandDTO();
                    dto.setId(entity.getId());
                    dto.setName(entity.getName());
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
        return dto;
    }

    public BrandDTO updateBrand(BrandDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Brand ID must not be null for update");
        }

        BrandEntity existing = repo.findById(dto.getId())
            .orElseThrow(() -> new RuntimeException("Brand not found"));

        existing.setName(dto.getName());

        BrandEntity updated = repo.save(existing);

        BrandDTO updatedDto = new BrandDTO();
        updatedDto.setId(updated.getId());
        updatedDto.setName(updated.getName());

        return updatedDto;
    }

    public void deleteBrand(Long id) {
        BrandEntity existing = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Brand not found with id: " + id));

        existing.setDelFg(0);
        repo.save(existing);
    }
    
}
