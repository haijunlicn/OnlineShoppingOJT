package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.UserAddressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddressEntity, Integer> {
    List<UserAddressEntity> findByUserId(Integer userId);
}
