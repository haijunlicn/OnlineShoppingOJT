package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "refund_items")
public class RefundItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "refund_request_id")
    private RefundRequestEntity refundRequest;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_item_id")
    private OrderItemEntity orderItem;

    @Column(nullable = false)
    private int quantity;

    @ManyToOne
    @JoinColumn(name = "reason_id")
    private RefundReasonEntity reason;

    @Column(columnDefinition = "TEXT")
    private String customerNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RefundItemStatus status = RefundItemStatus.REQUESTED;

    // Admin rejection fields — per item
    @ManyToOne
    @JoinColumn(name = "rejection_reason_id")
    private RejectionReasonEntity rejectionReason;

    @Column(columnDefinition = "TEXT")
    private String adminComment; // optional custom note

    private LocalDateTime updatedAt = LocalDateTime.now();

    // Add this to link refund item to its proof images
    @OneToMany(mappedBy = "refundItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RefundItemImageEntity> images = new ArrayList<>();
}
