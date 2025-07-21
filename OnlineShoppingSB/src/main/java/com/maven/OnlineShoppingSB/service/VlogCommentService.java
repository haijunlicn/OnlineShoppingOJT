package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.VlogCommentDTO;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.entity.VlogCommentEntity;
import com.maven.OnlineShoppingSB.entity.VlogEntity;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.repository.VlogCommentRepository;
import com.maven.OnlineShoppingSB.repository.VlogRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VlogCommentService {

    @Autowired
    private VlogCommentRepository commentRepository;

    @Autowired
    private VlogRepository vlogRepository;

    @Autowired
    private UserRepository userRepository;

    public VlogCommentDTO createComment(VlogCommentDTO dto) {
        VlogCommentEntity entity = new VlogCommentEntity();

        entity.setAuthor(dto.getAuthor());
        entity.setText(dto.getText());
        entity.setAvatarInitial(dto.getAvatarInitial());

        // Use commentDate from DTO or current time if null
        if (dto.getCommentDate() == null) {
            entity.setCommentDate(LocalDateTime.now());
        } else {
            entity.setCommentDate(dto.getCommentDate());
        }

        // Link to VlogEntity
        VlogEntity vlog = vlogRepository.findById(dto.getVlogId())
                .orElseThrow(() -> new RuntimeException("Vlog not found with id: " + dto.getVlogId()));
        entity.setVlog(vlog);

        // Optional link to UserEntity
        if (dto.getUserId() != null) {
            UserEntity user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));
            entity.setUser(user);
        }

        VlogCommentEntity saved = commentRepository.save(entity);
        return convertToDto(saved);
    }

    public List<VlogCommentDTO> getCommentsByVlogId(Long vlogId) {
        List<VlogCommentEntity> entities = commentRepository.findByVlogIdOrderByCommentDateDesc(vlogId);
        return entities.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private VlogCommentDTO convertToDto(VlogCommentEntity entity) {
        VlogCommentDTO dto = new VlogCommentDTO();
        dto.setId(entity.getId());
        dto.setAuthor(entity.getAuthor());
        dto.setText(entity.getText());
        dto.setAvatarInitial(entity.getAvatarInitial());
        dto.setCommentDate(entity.getCommentDate());
        dto.setVlogId(entity.getVlog().getId());
        if (entity.getUser() != null) {
            dto.setUserId(entity.getUser().getId());
        }
        return dto;
    }
}
