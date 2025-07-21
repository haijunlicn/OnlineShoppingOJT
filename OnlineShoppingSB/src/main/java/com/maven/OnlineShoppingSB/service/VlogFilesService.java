package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.VlogFilesDTO;
import com.maven.OnlineShoppingSB.entity.VlogEntity;
import com.maven.OnlineShoppingSB.entity.VlogFilesEntity;
import com.maven.OnlineShoppingSB.repository.VlogFilesRepository;
import com.maven.OnlineShoppingSB.repository.VlogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class VlogFilesService {

    @Autowired
    private VlogFilesRepository vlogFileRepository;

    @Autowired
    private VlogRepository vlogRepository;

    public VlogFilesDTO createVlogFile(Long vlogId, VlogFilesDTO dto) {
        VlogEntity vlog = vlogRepository.findById(vlogId)
            .orElseThrow(() -> new RuntimeException("Vlog not found with id: " + vlogId));

        VlogFilesEntity entity = new VlogFilesEntity();
        entity.setFilePath(dto.getFilePath());
        entity.setFileType(getExtensionFromPath(dto.getFilePath())); // mp4 etc.
        entity.setVlog(vlog);

        VlogFilesEntity saved = vlogFileRepository.save(entity);
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

    public void deleteVlogFile(Long id) {
        VlogFilesEntity entity = vlogFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("VlogFile not found with id: " + id));
        vlogFileRepository.delete(entity);
    }

    private VlogFilesDTO convertToDto(VlogFilesEntity entity) {
        VlogFilesDTO dto = new VlogFilesDTO();
        dto.setId(entity.getId());
        dto.setFilePath(entity.getFilePath());
        dto.setFileType(entity.getFileType());
        return dto;
    }
    public String uploadVlogFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String uploadDir = "uploads/vlogs/";
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        String fileName = UUID.randomUUID().toString() + fileExtension;

        File dest = new File(uploadDir + fileName);
        dest.getParentFile().mkdirs(); // Create folders if not exist
        file.transferTo(dest);

        return "http://localhost:8080/" + uploadDir + fileName;
    }

}
