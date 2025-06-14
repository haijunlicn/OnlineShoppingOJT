package com.maven.OnlineShoppingSB.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "discount_user_groups")
@Getter
@Setter
public class DiscountUserGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    private LocalDateTime createdDate;

    // New relationship: group can have many members
    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL)
    private List<DiscountUserGroupMemberEntity> discountUserGroupMembers;
}