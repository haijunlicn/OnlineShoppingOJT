package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "customerGroup")
public class CustomerGroupEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "Group_id")
    private GroupEntity group;

    @ManyToOne
    @JoinColumn(name = "users_id")
    private UserEntity user;

}
