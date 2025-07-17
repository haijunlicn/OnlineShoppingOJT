package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.CustomerGroupEntity;
import com.maven.OnlineShoppingSB.entity.GroupEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerGroupRepository extends JpaRepository<CustomerGroupEntity, Long> {

    boolean existsByUserAndGroup(UserEntity user, GroupEntity group);

    CustomerGroupEntity findByUserAndGroup(UserEntity user, GroupEntity group);

    @Query("SELECT cg.group.id FROM CustomerGroupEntity cg WHERE cg.user.id = :userId")
    List<Long> findGroupIdsByUser(@Param("userId") Long userId);

}
