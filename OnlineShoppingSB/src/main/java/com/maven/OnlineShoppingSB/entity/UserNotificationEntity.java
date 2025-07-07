package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_notifications")
public class UserNotificationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User who received this notification.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /**
     * The notification this user received.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_id", nullable = false)
    private NotificationEntity notification;

    /**
     * Whether the user has read or seen this notification.
     */
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    /**
     * Timestamp when the notification was delivered to this user.
     */
    @Column(nullable = false)
    private LocalDateTime deliveredAt = LocalDateTime.now();

    /**
     * Timestamp when the user marked this notification as read (nullable).
     */
    @Column
    private LocalDateTime readAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotiMethod method;
}
