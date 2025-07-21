package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "product_answer"

)
public class ProductAnswerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private ProductQuestionEntity question;

    @ManyToOne
    private UserEntity admin; // admin user

    private String answerText;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
