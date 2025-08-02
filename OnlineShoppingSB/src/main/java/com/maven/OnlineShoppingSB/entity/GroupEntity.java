package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "groupTable")
public class GroupEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String createDate;
    private String updateDate;

    @OneToMany(mappedBy = "group",cascade = CascadeType.ALL,orphanRemoval = true)
    @JsonIgnore
    private List<CustomerGroupEntity> customerGroup;

    @OneToMany(mappedBy = "Group",cascade = CascadeType.ALL,orphanRemoval = true)
    @JsonIgnore
    private List<DiscountConditionGroupEntity> discountConditionGroups;
}
