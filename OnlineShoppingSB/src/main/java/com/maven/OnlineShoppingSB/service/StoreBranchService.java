package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.StoreBranchDto;
import com.maven.OnlineShoppingSB.entity.StoreBranch;
import com.maven.OnlineShoppingSB.repository.StoreBranchRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
@Service
public class StoreBranchService {

    @Autowired
    private StoreBranchRepository repository;
    @Autowired
    private ModelMapper modelMapper;

    public StoreBranchDto create(StoreBranchDto dto) {
        StoreBranch entity = modelMapper.map(dto, StoreBranch.class);
        entity.setDelFg(false); // Always set to 0 (not in use) on create
        StoreBranch saved = repository.save(entity);
        return modelMapper.map(saved, StoreBranchDto.class);
    }

    public List<StoreBranchDto> getAll() {
        return repository.findAll().stream()
                .map(branch -> modelMapper.map(branch, StoreBranchDto.class))
                .collect(Collectors.toList());
    }

    public StoreBranchDto getById(Integer id) {
        StoreBranch branch = repository.findById(id).orElseThrow(() -> new RuntimeException("Not Found"));
        return modelMapper.map(branch, StoreBranchDto.class);
    }

    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    public StoreBranchDto update(Integer id, StoreBranchDto dto) {
        StoreBranch existing = repository.findById(id).orElseThrow(() -> new RuntimeException("Not Found"));
        Boolean currentDelFg = existing.getDelFg(); // Save current value
        modelMapper.map(dto, existing);
        existing.setDelFg(currentDelFg); // Prevent delFg from being changed here
        existing.setUpdatedDate(java.time.LocalDateTime.now());
        StoreBranch updated = repository.save(existing);
        return modelMapper.map(updated, StoreBranchDto.class);
    }

    public void setStoreInUse(Integer id) {
        // Set all to del_fg = 0
        List<StoreBranch> allBranches = repository.findAll();
        for (StoreBranch branch : allBranches) {
            if (Boolean.TRUE.equals(branch.getDelFg())) {
                branch.setDelFg(false);
                repository.save(branch);
            }
        }
        // Set selected to del_fg = 1
        StoreBranch selected = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Not Found"));
        selected.setDelFg(true);
        repository.save(selected);
    }

    public StoreBranchDto getActiveStore() {
        StoreBranch active = repository.findFirstByDelFgTrue();
        return active != null ? modelMapper.map(active, StoreBranchDto.class) : null;
    }
}
