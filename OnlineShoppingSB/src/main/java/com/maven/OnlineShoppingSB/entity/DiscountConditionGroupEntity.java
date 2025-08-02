package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "discountConditionGroup")
public class DiscountConditionGroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Boolean logicOperator; // 0=OR, 1=AND

    @ManyToOne
    @JoinColumn(name = "discountMechanism_id")
    @JsonIgnore
    private DiscountMechanismEntity discountMechanism;

    @ManyToOne
    @JoinColumn(name = "Group_id")
    @JsonIgnore
    private GroupEntity Group;

    @OneToMany(mappedBy = "discountConditionGroup",cascade = CascadeType.ALL,orphanRemoval = true)
    private List<DiscountConditionEntity> discountCondition;

}
