package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "discount")
public class DiscountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private typeCA type;

    @Column(columnDefinition = "TEXT")

    private String description;

    
    @Column(nullable = true)
    private String code;

    
    @Column(nullable = true)
    private String currentRedemptionCount;

    
    @Column(nullable = true)
    private String imgUrl;

    private LocalDateTime startDate;
    private LocalDateTime endDate;


    private Boolean isActive;

    
    @Column(nullable = true)
    private Integer usageLimit;

    
    @Column(nullable = true)
    private Integer perUserLimit;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    // Relationships
    @OneToMany(mappedBy = "discount",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<DiscountMechanismEntity> discountMechanisms;

}
