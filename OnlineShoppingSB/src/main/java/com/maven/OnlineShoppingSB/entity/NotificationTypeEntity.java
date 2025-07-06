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
@Table(name = "notification_types")
public class NotificationTypeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Unique system-wide identifier for the notification type
     * (e.g. "ORDER_STATUS", "DISCOUNT_AVAILABLE").
     */
    @Column(nullable = false, unique = true)
    private String name;

    /**
     * Optional human-friendly description
     * (e.g. "Order status updates for customers").
     */
    @Column
    private String description;

    /**
     * Whether this notification type is intended only for admin users.
     */
    @Column(nullable = false)
    private boolean adminOnly = false;

    @OneToMany(mappedBy = "type", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<NotificationTypeMethodEntity> supportedMethods = new ArrayList<>();

    @Column(name = "title_template", nullable = false)
    private String titleTemplate; // e.g., "Order #{orderId} is now #{status}"

    @Column(name = "message_template", nullable = false, columnDefinition = "TEXT")
    private String messageTemplate; // e.g., "Your order #{orderId} has been marked as #{status}."

    // Helper method
    public boolean supportsMethod(NotiMethod method) {
        return supportedMethods.stream()
                .anyMatch(m -> m.getMethod() == method);
    }

}
