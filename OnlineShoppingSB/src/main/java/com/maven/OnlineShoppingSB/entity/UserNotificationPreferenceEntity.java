package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "user_notification_preferences",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "notification_type_id"})
)
public class UserNotificationPreferenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user this preference belongs to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    /**
     * The type of notification this preference controls.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    private NotificationTypeEntity notificationType;

    /**
     * Whether the user wants to receive this notification type.
     */
    @Column(nullable = false)
    private boolean enabled = true;

}
