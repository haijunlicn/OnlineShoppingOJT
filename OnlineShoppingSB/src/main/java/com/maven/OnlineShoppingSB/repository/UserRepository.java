package com.maven.OnlineShoppingSB.repository;

import java.util.List;
import java.util.Optional;

import com.maven.OnlineShoppingSB.entity.RoleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.UserEntity;


@Repository
public interface UserRepository extends JpaRepository<UserEntity, Integer> {
    boolean existsByEmail(String email);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findById(Long id); // for OTP verification/resend

    boolean existsByEmailAndRole(String email, RoleEntity role);

//    @Query("SELECT u FROM UserEntity u JOIN u.role r WHERE u.email = :email AND r.name = :roleName")
//    Optional<UserEntity> findByEmailAndRoleName(@Param("email") String email, @Param("roleName") String roleName);
//
//    @Query("SELECT u FROM UserEntity u JOIN u.role r WHERE u.email = :email AND r.name IN :roleNames")
//    Optional<UserEntity> findByEmailAndRoleNameIn(@Param("email") String email, @Param("roleNames") List<String> roleNames);

    @Query("SELECT u FROM UserEntity u WHERE u.email = :email AND u.role.type = :roleType")
    Optional<UserEntity> findByEmailAndRoleType(@Param("email") String email, @Param("roleType") Integer roleType);

}