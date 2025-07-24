package com.maven.OnlineShoppingSB.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.dto.VlogDTO;
import com.maven.OnlineShoppingSB.dto.VlogFilesDTO;
import com.maven.OnlineShoppingSB.entity.VlogEntity;
import com.maven.OnlineShoppingSB.entity.VlogFilesEntity;
import com.maven.OnlineShoppingSB.repository.VlogFilesRepository;
import com.maven.OnlineShoppingSB.repository.VlogRepository;

import jakarta.transaction.Transactional;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
public class VlogService {

    @Autowired
    private VlogRepository vlogRepository;

    @Autowired
    private VlogFilesRepository vlogFileRepository;

    @Transactional
    public VlogDTO createVlog(VlogDTO dto) {
        VlogEntity vlogEntity = new VlogEntity();
        vlogEntity.setTitle(dto.getTitle());
        vlogEntity.setVlogContent(dto.getVlogContent());

        VlogEntity savedVlog = vlogRepository.save(vlogEntity);

        if (dto.getVlogFiles() != null) {
            List<VlogFilesEntity> files = dto.getVlogFiles().stream().map(fileDto -> {
                VlogFilesEntity fileEntity = new VlogFilesEntity();
                fileEntity.setFilePath(fileDto.getFilePath());
                fileEntity.setFileType(fileDto.getFileType());
                fileEntity.setVlog(savedVlog);
                return fileEntity;
            }).collect(Collectors.toList());

            vlogFileRepository.saveAll(files);
            savedVlog.setVlogFiles(files);
        }

        return convertToDTO(savedVlog);
    }

    public List<VlogDTO> getAllVlogs() {
        List<VlogEntity> vlogs = vlogRepository.findAll();
        return vlogs.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public VlogDTO getById(Long id) {
        Optional<VlogEntity> optionalVlog = vlogRepository.findById(id);
        if (!optionalVlog.isPresent()) {
            throw new RuntimeException("Vlog not found with id: " + id);
        }
        return convertToDTO(optionalVlog.get());
    }

    @Transactional
    public VlogDTO updateVlog(VlogDTO dto) {
        if (dto.getId() == null) {
            throw new IllegalArgumentException("Vlog ID is required for update.");
        }

        VlogEntity existing = vlogRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("Vlog not found"));

        existing.setTitle(dto.getTitle());
        existing.setVlogContent(dto.getVlogContent());

        VlogEntity updated = vlogRepository.save(existing);

        if (dto.getVlogFiles() != null) {
            // Delete existing files
            List<VlogFilesEntity> existingFiles = vlogFileRepository.findByVlogId(updated.getId());
            vlogFileRepository.deleteAll(existingFiles);

            // Save new files
            List<VlogFilesEntity> newFiles = dto.getVlogFiles().stream().map(fileDto -> {
                VlogFilesEntity fileEntity = new VlogFilesEntity();
                fileEntity.setFilePath(fileDto.getFilePath());
                fileEntity.setFileType(fileDto.getFileType());
                fileEntity.setVlog(updated);
                return fileEntity;
            }).collect(Collectors.toList());

            vlogFileRepository.saveAll(newFiles);
            updated.setVlogFiles(newFiles);
        }
        return convertToDTO(updated);
    }

    public void deleteVlog(Long id) {
        VlogEntity existing = vlogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vlog not found with id: " + id));
        vlogRepository.delete(existing); 
    }

    private VlogDTO convertToDTO(VlogEntity entity) {
        VlogDTO dto = new VlogDTO();
        dto.setId(entity.getId());
        dto.setTitle(entity.getTitle());
        dto.setVlogContent(entity.getVlogContent());
        dto.setCreatedDate(entity.getCreatedDate());
        dto.setUpdatedDate(entity.getUpdatedDate());

        if (entity.getVlogFiles() != null) {
            List<VlogFilesDTO> files = entity.getVlogFiles().stream().map(file -> {
                VlogFilesDTO fileDto = new VlogFilesDTO();
                fileDto.setId(file.getId());
                fileDto.setFilePath(file.getFilePath());
                fileDto.setFileType(file.getFileType());
                return fileDto;
            }).collect(Collectors.toList());
            dto.setVlogFiles(files);
        }
        return dto;
    }
}
