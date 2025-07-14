package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "discountProduct")
public class DiscountProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "discountsMechanism_id")
    private DiscountMechanismEntity discountMechanism;

    @ManyToOne
    @JoinColumn(name = "products_id")
    private ProductEntity product;
}