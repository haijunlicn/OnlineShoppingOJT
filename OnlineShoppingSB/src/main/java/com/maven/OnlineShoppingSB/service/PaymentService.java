package com.maven.OnlineShoppingSB.service;

import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.PaymentDTO;
import com.maven.OnlineShoppingSB.entity.PaymentEntity;
import com.maven.OnlineShoppingSB.repository.PaymentRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository repo;

    @Autowired
    private ModelMapper mapper;

    public PaymentDTO createPaymentMethod(PaymentDTO dto) {
        // Check if active payment method with same name exists
        boolean exists = repo.findByMethodName(dto.getMethodName())
                .filter(pm -> pm.getStatus() == 1)
                .isPresent();

        if (exists) {
            throw new RuntimeException("Payment method with this name already exists.");
        }

        Optional<PaymentEntity> softDeleted = repo.findByMethodName(dto.getMethodName())
                .filter(pm -> pm.getStatus() == 0);

        PaymentEntity entity;
        if (softDeleted.isPresent()) {
            entity = softDeleted.get();
            entity.setStatus(1); // Reactivate
            entity.setQrPath(dto.getQrPath());
        } else {
            entity = mapper.map(dto, PaymentEntity.class);
            entity.setStatus(1);
        }

        PaymentEntity saved = repo.save(entity);
        return mapper.map(saved, PaymentDTO.class);
    }

    public List<PaymentDTO> getAllPaymentMethods() {
        List<PaymentEntity> list = repo.findByStatus(1);
        return list.stream()
                .map(entity -> mapper.map(entity, PaymentDTO.class))
                .collect(Collectors.toList());
    }

    public PaymentDTO getPaymentMethodById(int id) {
        PaymentEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found with id: " + id));
        return mapper.map(entity, PaymentDTO.class);
    }

    public PaymentDTO updatePaymentMethod(int id, PaymentDTO dto) {
        PaymentEntity existing = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        existing.setMethodName(dto.getMethodName());
        existing.setQrPath(dto.getQrPath());

        PaymentEntity updated = repo.save(existing);
        return mapper.map(updated, PaymentDTO.class);
    }

    public void deletePaymentMethod(int id) {
        PaymentEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment method not found"));

        entity.setStatus(0); 
        repo.save(entity);
    }
}
