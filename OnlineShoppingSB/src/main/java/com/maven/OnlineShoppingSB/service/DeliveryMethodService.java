package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.DeliveryMethodDto;
import com.maven.OnlineShoppingSB.entity.DeliveryMethodEntity;
import com.maven.OnlineShoppingSB.repository.DeliveryMethodRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DeliveryMethodService {
    @Autowired
    private DeliveryMethodRepository deliveryMethodRepository;
    @Autowired
    private ModelMapper modelMapper;

    public List<DeliveryMethodDto> getAvailableMethods(double distance) {
        List<DeliveryMethodEntity> methods = deliveryMethodRepository
                .findByMinDistanceLessThanEqualAndMaxDistanceGreaterThanEqual(distance, distance);
        return methods.stream()
                .map(m -> modelMapper.map(m, DeliveryMethodDto.class))
                .collect(Collectors.toList());
    }

    public List<DeliveryMethodDto> getAll() {
        return deliveryMethodRepository.findAll().stream()
                .map(m -> modelMapper.map(m, DeliveryMethodDto.class))
                .collect(Collectors.toList());
    }

    public DeliveryMethodDto getById(Integer id) {
        DeliveryMethodEntity entity = deliveryMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery method not found"));
        return modelMapper.map(entity, DeliveryMethodDto.class);
    }

    public DeliveryMethodDto create(DeliveryMethodDto dto) {
        DeliveryMethodEntity entity = modelMapper.map(dto, DeliveryMethodEntity.class);
        entity.setId(null); // Ensure new entity
        DeliveryMethodEntity saved = deliveryMethodRepository.save(entity);
        return modelMapper.map(saved, DeliveryMethodDto.class);
    }

    public DeliveryMethodDto update(Integer id, DeliveryMethodDto dto) {
        DeliveryMethodEntity entity = deliveryMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery method not found"));
        if (entity.getType() != null && entity.getType() == 1) {
            throw new RuntimeException("Cannot update the default delivery method.");
        }
        entity.setName(dto.getName());
        entity.setMinDistance(dto.getMinDistance());
        entity.setMaxDistance(dto.getMaxDistance());
        entity.setBaseFee(dto.getBaseFee());
        entity.setFeePerKm(dto.getFeePerKm());
        entity.setIcon(dto.getIcon());
        entity.setType(dto.getType());
        DeliveryMethodEntity saved = deliveryMethodRepository.save(entity);
        return modelMapper.map(saved, DeliveryMethodDto.class);
    }

    public void delete(Integer id) {
        DeliveryMethodEntity entity = deliveryMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Delivery method not found"));
        if (entity.getType() != null && entity.getType() == 1) {
            throw new RuntimeException("Cannot delete the default delivery method.");
        }
        deliveryMethodRepository.deleteById(id);
    }
}