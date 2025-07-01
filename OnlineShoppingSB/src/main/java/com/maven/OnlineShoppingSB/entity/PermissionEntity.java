package com.maven.OnlineShoppingSB.entity;

import java.util.Set;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;  // e.g. PRODUCT_CREATE

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * The resource this permission belongs to, e.g. "Product", "Order", "Discount".
     * Used mainly for UI grouping and organization.
     */
    @Column(nullable = false, length = 50)
    private String resource;

    /**
     * The type/category of permission, e.g. "resource", "system", "analytics".
     * Used for further classification in UI.
     */
    @Column(nullable = false, length = 50)
    private String type;

    @ManyToMany(mappedBy = "permissions")
    private Set<RoleEntity> roles;
}
