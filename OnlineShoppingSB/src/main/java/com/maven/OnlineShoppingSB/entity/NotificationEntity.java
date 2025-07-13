package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class NotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to the type of notification (ORDER_STATUS, BACK_IN_STOCK, etc.).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private NotificationTypeEntity type;

    /**
     * Optional JSON metadata stored as string (e.g. { "orderId": 123, "status": "SHIPPED" }).
     */
    @Column(columnDefinition = "JSON")
    private String metadata;

    /**
     * Timestamp when this notification was created (same for all users).
     */
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Optional title (nullable, for custom notifications)
     */
    @Column(length = 255)
    private String title;

    /**
     * Optional message body (nullable, for custom notifications)
     */
    @Column(columnDefinition = "TEXT")
    private String message;

    /**
     * Optional image URL for custom notifications
     */
    @Column(length = 500)
    private String imageUrl;

    /**
     * Optional timestamp to schedule notification delivery.
     */
    @Column
    private LocalDateTime scheduledAt;

    /**
     * Whether this notification has been delivered.
     */
    @Column(nullable = false)
    private boolean delivered = false;


}
