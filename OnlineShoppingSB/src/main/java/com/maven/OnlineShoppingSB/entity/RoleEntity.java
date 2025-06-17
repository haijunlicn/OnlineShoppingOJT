package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
@Data
public class RoleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    // 1 = Admin, 0 = Customer
    @Column(name = "type", nullable = false)
    private Integer type;

    @Column(name = "del_flg")
    private Integer delFg = 1;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<PermissionEntity> permissions;

    
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
