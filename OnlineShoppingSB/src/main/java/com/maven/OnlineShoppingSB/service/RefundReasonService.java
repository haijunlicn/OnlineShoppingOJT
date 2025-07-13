package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.RefundReasonDTO;
import com.maven.OnlineShoppingSB.entity.RefundReasonEntity;
import com.maven.OnlineShoppingSB.repository.RefundReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RefundReasonService {

    @Autowired
    private RefundReasonRepository repo;

    public RefundReasonDTO insert(RefundReasonDTO dto) {
        Optional<RefundReasonEntity> optional = repo.findByLabel(dto.getLabel());

        if (optional.isPresent()) {
            RefundReasonEntity existing = optional.get();
            if (existing.getDelFg() == 0) {
                existing.setDelFg(1);
                existing.setAllowCustomText(dto.getAllowCustomText()); // added
                RefundReasonEntity restored = repo.save(existing);
                return convertToDTO(restored);
            } else {
                throw new RuntimeException("Refund reason already exists.");
            }
        }

        RefundReasonEntity entity = new RefundReasonEntity();
        entity.setLabel(dto.getLabel());
        entity.setAllowCustomText(dto.getAllowCustomText()); // added
        entity.setDelFg(1);
        return convertToDTO(repo.save(entity));
    }

    public List<RefundReasonDTO> getAll() {
        return repo.findAll().stream()
                .filter(e -> e.getDelFg() == 1)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RefundReasonDTO getById(Long id) {
        RefundReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund reason not found."));
        return convertToDTO(entity);
    }

    public RefundReasonDTO update(RefundReasonDTO dto) {
        RefundReasonEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Refund reason not found."));

        if (!existing.getLabel().equalsIgnoreCase(dto.getLabel())) {
            Optional<RefundReasonEntity> duplicate = repo.findByLabel(dto.getLabel());
            if (duplicate.isPresent() && duplicate.get().getDelFg() == 1) {
                throw new RuntimeException("Another refund reason with this label exists.");
            }
            existing.setLabel(dto.getLabel());
        }

        existing.setAllowCustomText(dto.getAllowCustomText()); // added
        return convertToDTO(repo.save(existing));
    }

    public void delete(Long id) {
        RefundReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund reason not found."));
        entity.setDelFg(0);
        repo.save(entity);
    }

    private RefundReasonDTO convertToDTO(RefundReasonEntity entity) {
        RefundReasonDTO dto = new RefundReasonDTO();
        dto.setId(entity.getId());
        dto.setLabel(entity.getLabel());
        dto.setAllowCustomText(entity.getAllowCustomText()); // added
        dto.setDelFg(entity.getDelFg());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }
}
