package com.maven.OnlineShoppingSB.repository;

import com.maven.OnlineShoppingSB.entity.ProductAnswerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductAnswerRepository extends JpaRepository<ProductAnswerEntity, Long> {
    List<ProductAnswerEntity> findByQuestionId(Long questionId);
}