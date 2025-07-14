package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.dto.SalesChartPointDto;
import com.maven.OnlineShoppingSB.entity.OrderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {
    List<OrderEntity> findByUserIdAndDeletedFalse(Long userId);
    List<OrderEntity> findByDeletedFalseOrderByCreatedDateDesc();
    
    @Query(
      value = "SELECT c.name as groupName, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, SUM(oi.price * oi.quantity) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN product_variants v ON oi.variant_id = v.id " +
              "JOIN products p ON v.product_id = p.id " +
              "JOIN categories c ON p.category_id = c.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY c.name, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY c.name, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getSalesByCategoryAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT c.name as category, p.name as product, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, SUM(oi.price * oi.quantity) as value " +
          "FROM orders o " +
          "JOIN order_items oi ON o.id = oi.order_id " +
          "JOIN product_variants v ON oi.variant_id = v.id " +
          "JOIN products p ON v.product_id = p.id " +
          "JOIN categories c ON p.category_id = c.id " +
          "WHERE o.created_date BETWEEN :startDate AND :endDate " +
          "AND o.del_fg = false " +
          "GROUP BY c.name, p.name, DATE_FORMAT(o.created_date, :dateFormat) " +
          "ORDER BY c.name, p.name, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getSalesByProductAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT c.name as category, p.name as product, v.sku as variant, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, SUM(oi.price * oi.quantity) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN product_variants v ON oi.variant_id = v.id " +
              "JOIN products p ON v.product_id = p.id " +
              "JOIN categories c ON p.category_id = c.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY c.name, p.name, v.sku, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY c.name, p.name, v.sku, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getSalesByVariantAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT ua.city as groupName, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, SUM(oi.price * oi.quantity) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN user_addresses ua ON o.user_address_id = ua.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY ua.city, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY ua.city, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getSalesByCityAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT c.name as category, p.name as product, v.sku as variant, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, " +
          "SUM(oi.price * oi.quantity) as revenue, COUNT(oi.id) as orders " +
          "FROM orders o " +
          "JOIN order_items oi ON o.id = oi.order_id " +
          "JOIN product_variants v ON oi.variant_id = v.id " +
          "JOIN products p ON v.product_id = p.id " +
          "JOIN categories c ON p.category_id = c.id " +
          "WHERE o.created_date BETWEEN :startDate AND :endDate " +
          "AND o.del_fg = false " +
          "GROUP BY c.name, p.name, v.sku, DATE_FORMAT(o.created_date, :dateFormat) " +
          "ORDER BY c.name, p.name, v.sku, timePoint",
      nativeQuery = true
    )
    List<Object[]> getSalesByProductVariantAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    // New queries for order count metrics
    @Query(
      value = "SELECT c.name as groupName, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, COUNT(DISTINCT o.id) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN product_variants v ON oi.variant_id = v.id " +
              "JOIN products p ON v.product_id = p.id " +
              "JOIN categories c ON p.category_id = c.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY c.name, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY c.name, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getOrderCountByCategoryAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT c.name as category, p.name as product, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, COUNT(DISTINCT o.id) as value " +
          "FROM orders o " +
          "JOIN order_items oi ON o.id = oi.order_id " +
          "JOIN product_variants v ON oi.variant_id = v.id " +
          "JOIN products p ON v.product_id = p.id " +
          "JOIN categories c ON p.category_id = c.id " +
          "WHERE o.created_date BETWEEN :startDate AND :endDate " +
          "AND o.del_fg = false " +
          "GROUP BY c.name, p.name, DATE_FORMAT(o.created_date, :dateFormat) " +
          "ORDER BY c.name, p.name, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getOrderCountByProductAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT c.name as category, p.name as product, v.sku as variant, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, COUNT(DISTINCT o.id) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN product_variants v ON oi.variant_id = v.id " +
              "JOIN products p ON v.product_id = p.id " +
              "JOIN categories c ON p.category_id = c.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY c.name, p.name, v.sku, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY c.name, p.name, v.sku, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getOrderCountByVariantAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );

    @Query(
      value = "SELECT ua.city as groupName, DATE_FORMAT(o.created_date, :dateFormat) as timePoint, COUNT(DISTINCT o.id) as value " +
              "FROM orders o " +
              "JOIN order_items oi ON o.id = oi.order_id " +
              "JOIN user_addresses ua ON o.user_address_id = ua.id " +
              "WHERE o.created_date BETWEEN :startDate AND :endDate " +
              "AND o.del_fg = false " +
              "GROUP BY ua.city, DATE_FORMAT(o.created_date, :dateFormat) " +
              "ORDER BY ua.city, DATE_FORMAT(o.created_date, :dateFormat)",
      nativeQuery = true
    )
    List<Object[]> getOrderCountByCityAndDate(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate,
        @Param("dateFormat") String dateFormat
    );
}
