package com.maven.OnlineShoppingSB.service;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.OptionValueDTO;
import com.maven.OnlineShoppingSB.entity.OptionEntity;
import com.maven.OnlineShoppingSB.entity.OptionValueEntity;
import com.maven.OnlineShoppingSB.repository.OptionRepository;
import com.maven.OnlineShoppingSB.repository.OptionValueRepository;

@Service
public class OptionValueService {

    @Autowired
    private OptionValueRepository valueRepo;

    @Autowired
    private OptionRepository optionRepo;

    @Autowired
    private ModelMapper mapper;

    public OptionValueDTO createOptionValue(OptionValueDTO dto) {
        if (dto.getValue() == null || dto.getValue().isBlank()) {
            throw new IllegalArgumentException("Value name cannot be empty");
        }

        OptionValueEntity entity = mapper.map(dto, OptionValueEntity.class);

        OptionEntity option = optionRepo.findById(dto.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));
        entity.setOption(option);

        OptionValueEntity saved = valueRepo.save(entity);
        return mapper.map(saved, OptionValueDTO.class);
    }

    public List<OptionValueDTO> getValuesByOptionId(Integer optionId) {
        return valueRepo.findByOptionIdAndDelFg(optionId, 1).stream()
                .map(value -> mapper.map(value, OptionValueDTO.class))
                .collect(Collectors.toList());
    }

    public OptionValueDTO getOptionValueById(Long id) {
        OptionValueEntity entity = valueRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OptionValue not found"));
        return mapper.map(entity, OptionValueDTO.class);
    }

    public OptionValueDTO updateOptionValue(OptionValueDTO dto) {
        OptionValueEntity entity = valueRepo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("OptionValue not found"));

        if (dto.getValue() != null) {
            entity.setValue(dto.getValue());
        }

        if (dto.getOptionId() != null) {
            OptionEntity option = optionRepo.findById(dto.getOptionId())
                    .orElseThrow(() -> new RuntimeException("Option not found"));
            entity.setOption(option);
        }

        OptionValueEntity updated = valueRepo.save(entity);
        return mapper.map(updated, OptionValueDTO.class);
    }

    public void deleteOptionValue(Long id) {
        OptionValueEntity entity = valueRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("OptionValue not found"));
        entity.setDelFg(0);
        valueRepo.save(entity);
    }
}
