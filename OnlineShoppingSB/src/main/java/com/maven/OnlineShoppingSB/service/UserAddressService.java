package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.UserAddressDto;
import com.maven.OnlineShoppingSB.entity.UserAddressEntity;
import com.maven.OnlineShoppingSB.repository.UserAddressRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserAddressService {

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private ModelMapper modelMapper;

    private final Integer constantUserId = 4; // ❗ Later replace with authenticated user

    public UserAddressDto saveUserAddress(UserAddressDto dto) {
        UserAddressEntity entity = modelMapper.map(dto, UserAddressEntity.class);

        if (entity.getId() == null) {
            entity.setCreatedDate(LocalDateTime.now());
        }

        entity.setUserId(constantUserId); // 🧠 assign userId inside service
        entity.setUpdatedDate(LocalDateTime.now());

        UserAddressEntity saved = userAddressRepository.save(entity);
        return modelMapper.map(saved, UserAddressDto.class);
    }

    public List<UserAddressDto> getAllUserAddresses() {
        List<UserAddressEntity> list = userAddressRepository.findByUserId(constantUserId);
        return list.stream()
                .map(address -> modelMapper.map(address, UserAddressDto.class))
                .collect(Collectors.toList());
    }

    public UserAddressDto getUserAddressById(Integer id) {
        return userAddressRepository.findById(id)
                .map(address -> modelMapper.map(address, UserAddressDto.class))
                .orElse(null);
    }

    public void deleteUserAddress(Integer id) {
        userAddressRepository.deleteById(id);
    }

    // New method to get the first address of the constant user
    public List<UserAddressDto> getUserAddressesByUserId() {
        System.out.println("Fetching all user addresses for userId = " + constantUserId);
        List<UserAddressEntity> entities = userAddressRepository.findByUserId(constantUserId);
        return entities.stream()
                .map(entity -> modelMapper.map(entity, UserAddressDto.class))
                .collect(Collectors.toList());
    }
    public UserAddressDto updateUserAddress(Integer id, UserAddressDto dto) {
        UserAddressEntity existing = userAddressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found with ID: " + id));

        modelMapper.map(dto, existing); // overwrite fields from DTO
        existing.setUpdatedDate(LocalDateTime.now());

        UserAddressEntity updated = userAddressRepository.save(existing);
        return modelMapper.map(updated, UserAddressDto.class);
    }

}

