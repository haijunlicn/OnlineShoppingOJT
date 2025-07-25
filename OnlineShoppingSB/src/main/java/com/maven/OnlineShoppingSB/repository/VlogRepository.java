package com.maven.OnlineShoppingSB.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.VlogEntity;
import java.util.List;

@Repository
public interface VlogRepository extends JpaRepository<VlogEntity, Long> {

    @Query("SELECT DISTINCT v FROM VlogEntity v LEFT JOIN FETCH v.vlogFiles")
    List<VlogEntity> findAllWithFiles();

    @Query("SELECT v FROM VlogEntity v LEFT JOIN FETCH v.vlogFiles WHERE v.id = :id")
    VlogEntity findByIdWithFiles(@Param("id") Long id);
}