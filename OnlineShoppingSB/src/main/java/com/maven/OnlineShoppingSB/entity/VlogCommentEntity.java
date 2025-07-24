package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "vlog_comment")
public class VlogCommentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String author;

    @Column(nullable = false)
    private String text;

    @Column(name = "avatar_initial", length = 10, nullable = false)
    private String avatarInitial;

    @Column(name = "comment_date", nullable = false)
    private LocalDateTime commentDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vlog_id", nullable = false)
    private VlogEntity vlog;

    // ✅ Add this to link comment with UserEntity
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @PrePersist
    protected void onCreate() {
        this.commentDate = LocalDateTime.now();
    }
}
