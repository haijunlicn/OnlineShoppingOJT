package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.CustomerGroupEntity;
import com.maven.OnlineShoppingSB.entity.GroupEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;

@Repository
public interface CustomerGroupRepository extends JpaRepository<CustomerGroupEntity, Long> {

    boolean existsByUserAndGroup(UserEntity user, GroupEntity group);

    CustomerGroupEntity findByUserAndGroup(UserEntity user, GroupEntity group);

    @Query("SELECT cg.group.id FROM CustomerGroupEntity cg WHERE cg.user.id = :userId")
    List<Long> findGroupIdsByUser(@Param("userId") Long userId);

    @Query(value = """
    SELECT g.id as groupId, g.name as groupName, d.day as date, COUNT(cg.user_id) as count
    FROM group_entity g
    LEFT JOIN (
        SELECT cg.group_id, cg.user_id, DATE(cg.created_at) as day
        FROM customer_group_entity cg
        WHERE cg.created_at BETWEEN :from AND :to
    ) d ON g.id = d.group_id
    GROUP BY g.id, g.name, d.day
    ORDER BY g.id, d.day
    """, nativeQuery = true)
    List<Object[]> getGroupMembershipHistoryRaw(@Param("from") LocalDate from, @Param("to") LocalDate to);

}
