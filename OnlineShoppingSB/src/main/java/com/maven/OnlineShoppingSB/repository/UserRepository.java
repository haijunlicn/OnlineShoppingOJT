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
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    boolean existsByEmail(String email);

    Optional<UserEntity> findByEmail(String email);

    Optional<UserEntity> findById(Long id); // for OTP verification/resend

    boolean existsByEmailAndRole(String email, RoleEntity role);

    @Query("SELECT u FROM UserEntity u WHERE u.email = :email AND u.role.type = :roleType")
    Optional<UserEntity> findByEmailAndRoleType(@Param("email") String email, @Param("roleType") Integer roleType);

    // List<UserEntity> findAllById(List<Long> targetUserIds);

    List<UserEntity> findAllByRole_Type(Integer type); // ✅ fixed version

    @Query("""
                SELECT u FROM UserEntity u
                JOIN UserNotificationPreferenceEntity p ON p.user = u
                WHERE u.role.type = 0 AND u.role.delFg = 1 AND p.enabled = true AND p.notificationType.id = :notificationTypeId
            """)
    List<UserEntity> findAllNonAdminUsersWithEnabledNotification(@Param("notificationTypeId") Long notificationTypeId);

    // In UserRepository or your service query
    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.role r LEFT JOIN FETCH r.permissions WHERE u.email = :email")
    Optional<UserEntity> findByEmailWithRoleAndPermissions(@Param("email") String email);


}
