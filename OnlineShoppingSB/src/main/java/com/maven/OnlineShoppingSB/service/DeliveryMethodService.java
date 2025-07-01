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
}