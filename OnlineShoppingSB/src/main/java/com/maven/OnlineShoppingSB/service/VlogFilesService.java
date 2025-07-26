package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.VlogFilesDTO;
import com.maven.OnlineShoppingSB.entity.VlogEntity;
import com.maven.OnlineShoppingSB.entity.VlogFilesEntity;
import com.maven.OnlineShoppingSB.repository.VlogFilesRepository;
import com.maven.OnlineShoppingSB.repository.VlogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VlogFilesService {

    @Autowired
    private VlogFilesRepository vlogFileRepository;

    @Autowired
    private VlogRepository vlogRepository;

    public VlogFilesDTO createVlogFile(Long vlogId, VlogFilesDTO dto) {
        System.out.println("[DEBUG] createVlogFile called with vlogId: " + vlogId + ", dto: " + dto);
        System.out.println("[DEBUG] dto.getFilePath(): " + dto.getFilePath());
        VlogEntity vlog = vlogRepository.findById(vlogId)
            .orElseThrow(() -> new RuntimeException("Vlog not found with id: " + vlogId));

        VlogFilesEntity entity = new VlogFilesEntity();
        entity.setFilePath(dto.getFilePath());
        entity.setFileType(getExtensionFromPath(dto.getFilePath())); // mp4 etc.
        entity.setVlog(vlog);

        VlogFilesEntity saved = vlogFileRepository.save(entity);
        System.out.println("[DEBUG] entity.getFilePath() after save: " + saved.getFilePath());
        System.out.println("[DEBUG] Saved VlogFilesEntity: " + saved);
        return convertToDto(saved);
    }

    private String getExtensionFromPath(String path) {
        if (path != null && path.contains(".")) {
            return path.substring(path.lastIndexOf('.') + 1);
        }
        return "unknown";
    }

    public List<VlogFilesDTO> getFilesByVlogIdOrAll(Long vlogId) {
        List<VlogFilesEntity> files;

        if (vlogId != null && vlogId > 0) {
            files = vlogFileRepository.findByVlogId(vlogId);
        } else {
            files = vlogFileRepository.findAll();
        }

        return files.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
    }


    public VlogFilesDTO getById(Long id) {
        VlogFilesEntity entity = vlogFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VlogFile not found with id: " + id));
        return convertToDto(entity);
    }

    public VlogFilesDTO updateVlogFile(Long id, VlogFilesDTO dto) {
        VlogFilesEntity entity = vlogFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VlogFile not found with id: " + id));

        if (dto.getFilePath() != null) {
            entity.setFilePath(dto.getFilePath());
        }
        if (dto.getFileType() != null) {
            entity.setFileType(dto.getFileType());
        }

        VlogFilesEntity updated = vlogFileRepository.save(entity);
        return convertToDto(updated);
    }


    private VlogFilesDTO convertToDto(VlogFilesEntity entity) {
        VlogFilesDTO dto = new VlogFilesDTO();
        dto.setId(entity.getId());
        dto.setFilePath(entity.getFilePath());
        dto.setFileType(entity.getFileType());
        dto.setVlogId(entity.getVlog().getId());
        return dto;
    }
    public void deleteVlogFile(Long id) {
        VlogFilesEntity entity = vlogFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VlogFile not found with id: " + id));
        vlogFileRepository.delete(entity);
    }
}
