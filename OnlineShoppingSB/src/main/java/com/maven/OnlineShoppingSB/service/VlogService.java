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
        System.out.println("[DEBUG] Received VlogDTO for createVlog: " + dto);
        VlogEntity vlogEntity = new VlogEntity();
        vlogEntity.setTitle(dto.getTitle());
        vlogEntity.setVlogContent(dto.getVlogContent());
        vlogEntity.setFilePaths(dto.getFilePaths()); // <-- Save filePaths string

        VlogEntity savedVlog = vlogRepository.save(vlogEntity);

        if (dto.getVlogFiles() != null) {
            System.out.println("[DEBUG] VlogFiles count: " + dto.getVlogFiles().size());
            List<VlogFilesEntity> files = dto.getVlogFiles().stream().map(fileDto -> {
                System.out.println("[DEBUG] Processing VlogFilesDTO: " + fileDto);
                VlogFilesEntity fileEntity = new VlogFilesEntity();
                fileEntity.setFilePath(fileDto.getFilePath());
                fileEntity.setFileType(fileDto.getFileType());
                fileEntity.setVlog(savedVlog);
                return fileEntity;
            }).collect(Collectors.toList());

            vlogFileRepository.saveAll(files);
            savedVlog.setVlogFiles(files);
        } else {
            System.out.println("[DEBUG] No VlogFiles provided in VlogDTO");
        }

        return convertToDTO(savedVlog);
    }

    public List<VlogDTO> getAllVlogs() {
        List<VlogEntity> vlogs = vlogRepository.findAllWithFiles();
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
        existing.setFilePaths(dto.getFilePaths()); // <-- Update filePaths string

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
    private VlogDTO convertToDTO(VlogEntity vlog) {
        VlogDTO dto = new VlogDTO();
        dto.setId(vlog.getId());
        dto.setTitle(vlog.getTitle());
        dto.setVlogContent(vlog.getVlogContent());
        dto.setCreatedDate(vlog.getCreatedDate());
        dto.setUpdatedDate(vlog.getUpdatedDate());
        dto.setFilePaths(vlog.getFilePaths()); // <-- Map filePaths string

        if (vlog.getVlogFiles() != null) {
            List<VlogFilesDTO> fileDTOs = vlog.getVlogFiles().stream().map(file -> {
                VlogFilesDTO fileDTO = new VlogFilesDTO();
                fileDTO.setId(file.getId());
                fileDTO.setFilePath(file.getFilePath());
                fileDTO.setFileType(file.getFileType());
                return fileDTO;
            }).collect(Collectors.toList());
            dto.setVlogFiles(fileDTOs);
        }

        return dto;
    }
}
