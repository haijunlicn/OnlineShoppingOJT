package com.maven.OnlineShoppingSB.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notification_type_methods")
public class NotificationTypeMethodEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notification_type_id", nullable = false)
    @JsonBackReference
    private NotificationTypeEntity type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotiMethod method;

    @Column(name = "status", nullable = false)
    private Integer displayOrder = 0;
}
