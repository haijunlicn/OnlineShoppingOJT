package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.OptionDTO;
import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.repository.OptionRepository;

@Service
public class OptionService {

    @Autowired
    private OptionRepository optionRepo;

    @Autowired
    private ModelMapper mapper;

    public OptionDTO createOption(OptionDTO dto) {
        OptionEntity entity = mapper.map(dto, OptionEntity.class);
        OptionEntity saved = optionRepo.save(entity);
        return mapper.map(saved, OptionDTO.class);
    }

    public List<OptionDTO> getAllOptions() {
        return optionRepo.findByDelFg(1).stream()
                .map(entity -> mapper.map(entity, OptionDTO.class))
                .collect(Collectors.toList());
    }

    public OptionDTO getOptionById(Long id) {
        OptionEntity entity = optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option not found"));
        return mapper.map(entity, OptionDTO.class);
    }

    public OptionDTO updateOption(OptionDTO dto) {
        OptionEntity entity = optionRepo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        entity.setName(dto.getName());
        OptionEntity updated = optionRepo.save(entity);
        return mapper.map(updated, OptionDTO.class);
    }

    public void deleteOption(Long id) {
        OptionEntity entity = optionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Option not found"));
        entity.setDelFg(0);
        optionRepo.save(entity);
    }
}
