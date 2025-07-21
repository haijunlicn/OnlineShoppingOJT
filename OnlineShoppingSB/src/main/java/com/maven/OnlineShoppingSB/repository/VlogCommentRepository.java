package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.VlogCommentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VlogCommentRepository extends JpaRepository<VlogCommentEntity, Long> {
    List<VlogCommentEntity> findByVlogIdOrderByCommentDateDesc(Long vlogId);
}
