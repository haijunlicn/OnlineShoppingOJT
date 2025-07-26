package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "delivery_methods")
public class DeliveryMethodEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name; // e.g., "Car", "Bike"
    private Double minDistance; // in km (inclusive)
    private Double maxDistance; // in km (inclusive)
    private Integer baseFee; // MMK
    private Integer feePerKm; // MMK per km
    private Integer feePerKmOutCity; // MMK per km for out of city
    @Column(name = "icon", length = 100)
    private String icon; // URL or path to the image
    @Column(name = "type")
    private Integer type;
    @OneToMany(mappedBy = "deliveryMethod", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<OrderEntity> orders;

}