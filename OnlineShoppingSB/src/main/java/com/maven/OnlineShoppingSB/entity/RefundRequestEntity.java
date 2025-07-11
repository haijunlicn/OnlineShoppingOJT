package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "refund_requests")
public class RefundRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundStatus status = RefundStatus.REQUESTED;

    @Column(length = 100)
    private String returnTrackingCode; // Provided by admin

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "refundRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RefundItemEntity> items = new HashSet<>();


//    @OneToMany(mappedBy = "refundRequest", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<RefundStatusHistoryEntity> statusHistoryList = new ArrayList<>();

    @OneToMany(mappedBy = "refundRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<RefundStatusHistoryEntity> statusHistoryList = new HashSet<>();

    private LocalDateTime receivedDate;
    private LocalDateTime refundedDate;

}
