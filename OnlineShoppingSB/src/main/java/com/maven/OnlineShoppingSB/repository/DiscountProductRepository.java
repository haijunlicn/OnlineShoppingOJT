package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.DiscountProductEntity;
import com.maven.OnlineShoppingSB.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountProductRepository extends JpaRepository<DiscountProductEntity, Integer> {

    @Query("SELECT dp FROM DiscountProductEntity dp " +
            "JOIN FETCH dp.discountMechanism dm " +
            "JOIN FETCH dm.discount d " +
            "WHERE d.isActive = true AND (d.delFg = false OR d.delFg IS NULL)")
    List<DiscountProductEntity> findAllActiveDiscountProducts();

//    @Query("""
//                SELECT dp.product
//                FROM DiscountProductEntity dp
//                JOIN dp.discountMechanism dm
//                JOIN dm.discount d
//                WHERE d.id = :discountId
//            """)
//    List<ProductEntity> findProductsByDiscountId(Integer discountId);

    @Query("""
                SELECT dp.product
                FROM DiscountProductEntity dp
                WHERE dp.discountMechanism.id = :mechanismId
            """)
    List<ProductEntity> findProductsByMechanismId(Integer mechanismId);


}
