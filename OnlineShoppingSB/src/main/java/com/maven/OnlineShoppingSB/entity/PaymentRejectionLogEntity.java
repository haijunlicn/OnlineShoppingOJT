package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "payment_rejection_logs")
public class PaymentRejectionLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private OrderEntity order;

    @ManyToOne(optional = true)
    @JoinColumn(name = "reason_id")
    private PaymentRejectionReasonEntity reason; // selected reason

    @Column(name = "custom_reason")
    private String customReason; // admin's note if allowed

    @ManyToOne(optional = false)
    @JoinColumn(name = "rejected_by")
    private UserEntity rejectedBy;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;
}
