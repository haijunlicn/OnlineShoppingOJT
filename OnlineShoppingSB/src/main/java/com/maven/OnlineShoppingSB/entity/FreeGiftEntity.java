package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.apache.commons.math3.stat.descriptive.summary.Product;

@Getter
@Setter
@Entity
@Table(name = "freeGift")
public class FreeGiftEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "DiscountMechanism_id")
    private DiscountMechanismEntity mechanism;

    @ManyToOne
    @JoinColumn(name = "products_id")
    private ProductEntity product;
}
