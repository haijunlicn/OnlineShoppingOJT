package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "order_status_type")
@Getter
@Setter
public class OrderStatusTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;


    @Column(name = "is_final")
    private Boolean isFinal = false;

    @Column(name = "is_failure")
    private Boolean isFailure = false;
}