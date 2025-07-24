package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.UserAddressEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddressEntity, Integer> {
    List<UserAddressEntity> findByUserId(Integer userId);
    UserAddressEntity findFirstByUserId(Integer userId);

    @Query("SELECT ua.city, COUNT(DISTINCT ua.user.id) FROM UserAddressEntity ua GROUP BY ua.city")
    List<Object[]> countUsersByCity();

    @Query("SELECT ua.township, COUNT(DISTINCT ua.user.id) FROM UserAddressEntity ua WHERE ua.city = :city GROUP BY ua.township")
    List<Object[]> countUsersByTownship(@Param("city") String city);

    @Query("""
        SELECT ua.city, COUNT(DISTINCT ua.user.id)
        FROM UserAddressEntity ua
        WHERE (:orderedOnly = false OR ua.user.id IN (SELECT DISTINCT o.user.id FROM OrderEntity o))
        GROUP BY ua.city
    """)
    List<Object[]> countUsersByCityWithOrderFilter(@Param("orderedOnly") boolean orderedOnly);

    @Query("""
        SELECT ua.township, COUNT(DISTINCT ua.user.id),
               SUM(CASE WHEN ua.user.id IN (SELECT DISTINCT o.user.id FROM OrderEntity o) THEN 1 ELSE 0 END)
        FROM UserAddressEntity ua
        WHERE ua.city = :city
        GROUP BY ua.township
    """)
    List<Object[]> countUsersByTownshipWithOrder(@Param("city") String city);
}
