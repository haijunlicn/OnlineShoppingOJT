package com.maven.OnlineShoppingSB.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.RoleEntity;

@Repository
public interface RoleRepository extends JpaRepository<RoleEntity, Integer> {
    Optional<RoleEntity> findByName(String name);
    List<RoleEntity> findByDelFg(Integer delFg);
    List<RoleEntity> findByTypeAndDelFg(Integer type, Integer delFg);
    
    @Query("SELECT r FROM RoleEntity r LEFT JOIN FETCH r.users WHERE r.type = :type AND r.delFg = :delFg")
    List<RoleEntity> findByTypeAndDelFgWithUsers(@Param("type") Integer type, @Param("delFg") Integer delFg);


}
