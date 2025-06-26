package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255, nullable = false, unique = true)
    private String email;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 20)
    private String phone;

    @Column(length = 255, nullable = false)
    private String password;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private RoleEntity role;

    private Boolean isVerified;
    private Boolean delFg;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<OtpEntity> otp;

    // New relationship: user can join many discount groups
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<DiscountUserGroupMemberEntity> discountUserGroupMembers;
}