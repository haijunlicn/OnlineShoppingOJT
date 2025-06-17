package com.maven.OnlineShoppingSB.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "roles")
@Getter
@Setter
@Data
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "type", nullable = false)
    private Integer type; // 1 = ADMIN, 0 = CUSTOMER

    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "role")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<UserEntity> users;

    // Add helper method
    public boolean isAdmin() {
        return type != null && type == 1;
    }
}
