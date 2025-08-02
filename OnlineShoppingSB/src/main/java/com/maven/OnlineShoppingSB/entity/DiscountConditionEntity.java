package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "discountCondition")
public class DiscountConditionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    private conditionType conditionType;

    private String conditionDetail;
    private Boolean delFg;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @Enumerated(EnumType.STRING)
    private Operator operator;

    private String value;

    @ManyToOne
    @JoinColumn(name = "discountConditionGroup_id")
    @JsonIgnore
    private DiscountConditionGroupEntity discountConditionGroup;
}
