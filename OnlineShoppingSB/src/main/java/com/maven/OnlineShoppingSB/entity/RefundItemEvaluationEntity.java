package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter@Entity
@Table(name = "refund_item_evaluations")
public class RefundItemEvaluationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "refund_item_id", unique = true)
    private RefundItemEntity refundItem;

    @Column(nullable = false)
    private int receivedQty;

    @Column(nullable = false)
    private int resellableQty;

    @Column(nullable = false)
    private int damagedQty;

    @Column(columnDefinition = "TEXT")
    private String warehouseNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluated_by")
    private UserEntity evaluatedBy;

    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
