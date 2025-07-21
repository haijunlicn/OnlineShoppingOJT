package com.maven.OnlineShoppingSB.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import com.maven.OnlineShoppingSB.entity.VlogFilesEntity;

@Repository
public interface VlogFilesRepository extends JpaRepository<VlogFilesEntity, Long> {
    List<VlogFilesEntity> findByVlogId(Long vlogId);

}