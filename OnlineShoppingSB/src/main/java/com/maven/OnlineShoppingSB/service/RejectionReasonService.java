package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.RejectionReasonDTO;
import com.maven.OnlineShoppingSB.entity.RejectionReasonEntity;
import com.maven.OnlineShoppingSB.repository.RejectionReasonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RejectionReasonService {

    @Autowired
    private RejectionReasonRepository repo;

    public RejectionReasonDTO insert(RejectionReasonDTO dto) {
        Optional<RejectionReasonEntity> optional = repo.findByLabel(dto.getLabel());

        if (optional.isPresent()) {
            RejectionReasonEntity existing = optional.get();
            if (existing.getDelFg() == 0) {
                existing.setDelFg(1);
                existing.setAllowCustomText(dto.getAllowCustomText()); // ✅ added
                return convertToDTO(repo.save(existing));
            } else {
                throw new RuntimeException("Rejection reason already exists.");
            }
        }

        RejectionReasonEntity entity = new RejectionReasonEntity();
        entity.setLabel(dto.getLabel());
        entity.setAllowCustomText(dto.getAllowCustomText()); // ✅ added
        entity.setDelFg(1);
        return convertToDTO(repo.save(entity));
    }

    public List<RejectionReasonDTO> getAll() {
        return repo.findAll().stream()
                .filter(e -> e.getDelFg() == 1)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public RejectionReasonDTO getById(Long id) {
        RejectionReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Rejection reason not found."));
        return convertToDTO(entity);
    }

    public RejectionReasonDTO update(RejectionReasonDTO dto) {
        RejectionReasonEntity existing = repo.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Rejection reason not found."));

        if (!existing.getLabel().equalsIgnoreCase(dto.getLabel())) {
            Optional<RejectionReasonEntity> duplicate = repo.findByLabel(dto.getLabel());
            if (duplicate.isPresent() && duplicate.get().getDelFg() == 1) {
                throw new RuntimeException("Another rejection reason with this label exists.");
            }
            existing.setLabel(dto.getLabel());
        }

        existing.setAllowCustomText(dto.getAllowCustomText()); // ✅ added
        return convertToDTO(repo.save(existing));
    }

    public void delete(Long id) {
        RejectionReasonEntity entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Rejection reason not found."));
        entity.setDelFg(0);
        repo.save(entity);
    }

    private RejectionReasonDTO convertToDTO(RejectionReasonEntity entity) {
        RejectionReasonDTO dto = new RejectionReasonDTO();
        dto.setId(entity.getId());
        dto.setLabel(entity.getLabel());
        dto.setAllowCustomText(entity.getAllowCustomText());
        dto.setDelFg(entity.getDelFg());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());
        return dto;
    }
}
