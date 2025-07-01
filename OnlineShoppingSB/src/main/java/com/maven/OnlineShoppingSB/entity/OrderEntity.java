package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Order belongs to a user
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Order has a shipping address
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_address_id", nullable = false)
    private UserAddressEntity userAddress;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "totalAmount")
    private Integer totalAmount;

    @Column(name = "shippingFee")
    private Integer shippingFee;

    @Column(name = "payment_proof_path")
    private String paymentProofPath;

    @Column(name = "del_fg")
    private Boolean deleted = false;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<OrderItemEntity> items;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private List<OrderStatusHistoryEntity> statusHistoryList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "delivery_method_id", nullable = false)
    private DeliveryMethodEntity deliveryMethod;

//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "payment_method_id", nullable = false)
//    private PaymentEntity paymentMethod;
}