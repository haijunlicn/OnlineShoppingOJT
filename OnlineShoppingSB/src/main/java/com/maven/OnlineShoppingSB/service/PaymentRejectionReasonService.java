package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.PaymentRejectionReasonDTO;
import com.maven.OnlineShoppingSB.dto.RejectionReasonDTO;
import com.maven.OnlineShoppingSB.entity.PaymentRejectionReasonEntity;
import com.maven.OnlineShoppingSB.entity.RejectionReasonEntity;
import com.maven.OnlineShoppingSB.repository.PaymentRejectionReasonRepository;
import com.maven.OnlineShoppingSB.repository.RejectionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentRejectionReasonService {

    @Autowired
    private PaymentRejectionReasonRepository repo;

    public PaymentRejectionReasonDTO insert(PaymentRejectionReasonDTO dto) {
        Optional<PaymentRejectionReasonEntity> optional = repo.findByLabel(dto.getLabel());

        if (optional.isPresent()) {
            PaymentRejectionReasonEntity existing = optional.get();
            if (existing.getDelFg() == 0) {
                existing.setDelFg(1);
                existing.setAllowCustomText(dto.getAllowCustomText());
                return convertToDTO(repo.save(existing));
            } else {
                throw new RuntimeException("Reason already exists.");
            }
        }

        PaymentRejectionReasonEntity entity = new PaymentRejectionReasonEntity();
        entity.setLabel(dto.getLabel());
        entity.setAllowCustomText(dto.getAllowCustomText());
        entity.setDelFg(1);
        return convertToDTO(repo.save(entity));
    }

    public List<PaymentRejectionReasonDTO> getAll() {
        return repo.findAll().stream()
                .filter(e -> e.getDelFg() == 1)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PaymentRejectionReasonDTO getById(Long id) {
        PaymentRejectionReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reason not found."));
        return convertToDTO(entity);
    }

    public PaymentRejectionReasonDTO update(PaymentRejectionReasonDTO dto) {
        PaymentRejectionReasonEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Reason not found."));

        if (!existing.getLabel().equalsIgnoreCase(dto.getLabel())) {
            Optional<PaymentRejectionReasonEntity> duplicate = repo.findByLabel(dto.getLabel());
            if (duplicate.isPresent() && duplicate.get().getDelFg() == 1) {
                throw new RuntimeException("Another reason with this label exists.");
            }
            existing.setLabel(dto.getLabel());
        }

        existing.setAllowCustomText(dto.getAllowCustomText());
        return convertToDTO(repo.save(existing));
    }

    public void delete(Long id) {
        PaymentRejectionReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Reason not found."));
        entity.setDelFg(0);
        repo.save(entity);
    }

    private PaymentRejectionReasonDTO convertToDTO(PaymentRejectionReasonEntity entity) {
        PaymentRejectionReasonDTO dto = new PaymentRejectionReasonDTO();
        dto.setId(entity.getId());
        dto.setLabel(entity.getLabel());
        dto.setAllowCustomText(entity.getAllowCustomText());
        dto.setDelFg(entity.getDelFg());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }

}
