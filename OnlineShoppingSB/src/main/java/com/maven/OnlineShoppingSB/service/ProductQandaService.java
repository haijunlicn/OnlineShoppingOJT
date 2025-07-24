package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.ProductAnswerDto;
import com.maven.OnlineShoppingSB.dto.ProductQuestionDto;
import com.maven.OnlineShoppingSB.entity.ProductAnswerEntity;
import com.maven.OnlineShoppingSB.entity.ProductQuestionEntity;
import com.maven.OnlineShoppingSB.repository.ProductAnswerRepository;
import com.maven.OnlineShoppingSB.repository.ProductQuestionRepository;
import com.maven.OnlineShoppingSB.repository.ProductRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;

import java.util.List;
import java.util.Map;

@Service
public class ProductQandaService {
    @Autowired
    private ProductQuestionRepository questionRepo;
    @Autowired private ProductAnswerRepository answerRepo;
    @Autowired private ProductRepository productRepo;
    @Autowired private UserRepository userRepo;

    // Get paginated questions (with answers)
    public Map<String, Object> getQuestions(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductQuestionEntity> questionPage = questionRepo.findByProductId(productId, pageable);

        List<ProductQuestionDto> dtos = questionPage.getContent().stream().map(this::toDto).toList();

        Map<String, Object> result = new HashMap<>();
        result.put("questions", dtos);
        result.put("total", questionPage.getTotalElements());
        return result;
    }

    // Add question
    public ProductQuestionDto addQuestion(Long productId, Long userId, String questionText) {
        ProductQuestionEntity q = new ProductQuestionEntity();
        q.setProduct(productRepo.findById(productId).orElseThrow());
        q.setUser(userRepo.findById(userId).orElseThrow());
        q.setQuestionText(questionText);
        q.setCreatedAt(LocalDateTime.now());
        q.setUpdatedAt(LocalDateTime.now());
        q = questionRepo.save(q);
        return toDto(q);
    }

    // Add answer (admin only)
    public ProductAnswerDto addAnswer(Long questionId, Long adminId, String answerText) {
        ProductAnswerEntity a = new ProductAnswerEntity();
        a.setQuestion(questionRepo.findById(questionId).orElseThrow());
        a.setAdmin(userRepo.findById(adminId).orElseThrow());
        a.setAnswerText(answerText);
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());
        a = answerRepo.save(a);
        return toAnswerDto(a);
    }

    // Admin: get all questions (all products, paginated)
    public Map<String, Object> getAllQuestions(int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ProductQuestionEntity> questionPage = questionRepo.findAll(pageable);
        List<ProductQuestionDto> dtos = questionPage.getContent().stream().map(this::toDto).toList();
        Map<String, Object> result = new HashMap<>();
        result.put("questions", dtos);
        result.put("total", questionPage.getTotalElements());
        return result;
    }

    // Admin: edit answer
    public ProductAnswerDto editAnswer(Long answerId, Long adminId, String answerText) {
        ProductAnswerEntity answer = answerRepo.findById(answerId).orElseThrow();
        if (!answer.getAdmin().getId().equals(adminId)) {
            throw new RuntimeException("You can only edit your own answer");
        }
        answer.setAnswerText(answerText);
        answer.setUpdatedAt(LocalDateTime.now());
        answer = answerRepo.save(answer);
        return toAnswerDto(answer);
    }

    // Admin: delete question (and its answers)
    public void deleteQuestion(Long questionId) {
        questionRepo.deleteById(questionId); // orphanRemoval = true, cascade = ALL
    }

    // Delete question (customer only)
    public void deleteQuestionByCustomer(Long questionId, Long userId) {
        ProductQuestionEntity q = questionRepo.findById(questionId).orElseThrow();
        if (!q.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only delete your own question");
        }
        questionRepo.deleteById(questionId);
    }

    // Edit question (customer only)
    public ProductQuestionDto editQuestionByCustomer(Long questionId, Long userId, String questionText) {
        ProductQuestionEntity q = questionRepo.findById(questionId).orElseThrow();
        if (!q.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only edit your own question");
        }
        q.setQuestionText(questionText);
        q.setUpdatedAt(LocalDateTime.now());
        q = questionRepo.save(q);
        return toDto(q);
    }

    // Helper: Convert entity to DTO
  private ProductQuestionDto toDto(ProductQuestionEntity q) {
    ProductQuestionDto dto = new ProductQuestionDto();
    dto.setId(q.getId());
    dto.setProductId(q.getProduct().getId());
    dto.setProductName(q.getProduct().getName()); // <-- ဒီလိုတခါတည်း set လုပ်ပါ
    dto.setUserId(q.getUser().getId());
    dto.setUserName(q.getUser().getName());
    dto.setQuestionText(q.getQuestionText());
    dto.setCreatedAt(q.getCreatedAt());
    dto.setUpdatedAt(q.getUpdatedAt());
    dto.setAnswers(q.getAnswers().stream().map(this::toAnswerDto).toList());
    return dto;
}
    private ProductAnswerDto toAnswerDto(ProductAnswerEntity a) {
        ProductAnswerDto dto = new ProductAnswerDto();
        dto.setId(a.getId());
        dto.setQuestionId(a.getQuestion().getId());
        dto.setAdminId(a.getAdmin().getId());
        dto.setAdminName(a.getAdmin().getName());
        dto.setAnswerText(a.getAnswerText());
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());
        return dto;
    }
}