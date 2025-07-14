package com.maven.OnlineShoppingSB.entity;

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
    private Boolean logicOperator; // 0=AND, 1=OR

    @ManyToOne
    @JoinColumn(name = "discountMechanism_id")
    private DiscountMechanismEntity discountMechanism;

    @ManyToOne
    @JoinColumn(name = "Group_id")
    private  GroupEntity Group;

    @OneToMany(mappedBy = "discountConditionGroup",cascade = CascadeType.ALL)
    private List<DiscountConditionEntity> discountCondition;

}
