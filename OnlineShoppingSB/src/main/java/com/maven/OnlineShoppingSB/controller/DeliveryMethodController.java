package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.DeliveryMethodDto;
import com.maven.OnlineShoppingSB.service.DeliveryMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.maven.OnlineShoppingSB.service.CloudinaryService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/delivery-methods")
public class DeliveryMethodController {
    @Autowired
    private DeliveryMethodService deliveryMethodService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/available")
    public List<DeliveryMethodDto> getAvailableMethods(@RequestParam double distance) {
        return deliveryMethodService.getAvailableMethods(distance);
    }

    @GetMapping
    public List<DeliveryMethodDto> getAll() {
        return deliveryMethodService.getAll();
    }

    @GetMapping("/{id}")
    public DeliveryMethodDto getById(@PathVariable Integer id) {
        return deliveryMethodService.getById(id);
    }

    @PostMapping
    public DeliveryMethodDto create(@RequestBody DeliveryMethodDto dto) {
        return deliveryMethodService.create(dto);
    }

    @PutMapping("/{id}")
    public DeliveryMethodDto update(@PathVariable Integer id, @RequestBody DeliveryMethodDto dto) {
        return deliveryMethodService.update(id, dto);
    }

    @PutMapping(value = "/{id}/with-icon", consumes = {"multipart/form-data"})
    public ResponseEntity<DeliveryMethodDto> updateWithIcon(
            @PathVariable Integer id,
            @RequestPart("dto") DeliveryMethodDto dto,
            @RequestPart(value = "icon", required = false) MultipartFile iconFile) {
        try {
            if (iconFile != null && !iconFile.isEmpty()) {
                String iconUrl = cloudinaryService.uploadFile(iconFile); // or your file storage logic
                dto.setIcon(iconUrl);
            }
            DeliveryMethodDto updated = deliveryMethodService.update(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        deliveryMethodService.delete(id);
    }
}