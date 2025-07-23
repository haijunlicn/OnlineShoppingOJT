package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.ProductAnswerDto;
import com.maven.OnlineShoppingSB.dto.ProductQuestionDto;
import com.maven.OnlineShoppingSB.service.ProductQandaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:4200")
public class ProductQandaController {
    @Autowired
    private ProductQandaService qandaService;

    // Get paginated questions for a product
    @GetMapping("/public/{productId}/questions")
    public Map<String, Object> getQuestions(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "5") int size
    ) {
        return qandaService.getQuestions(productId, page, size);
    }

    // Add question (customer)
    @PostMapping("/{productId}/questions")
    public ProductQuestionDto addQuestion(
            @PathVariable Long productId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Long userId = ((CustomUserDetails) authentication.getPrincipal()).getUser().getId();
        return qandaService.addQuestion(productId, userId, body.get("questionText"));
    }

    // Add answer (admin)
    @PostMapping("/questions/{questionId}/answers")
    public ProductAnswerDto addAnswer(
            @PathVariable Long questionId,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Long adminId = ((CustomUserDetails) authentication.getPrincipal()).getUser().getId();
        return qandaService.addAnswer(questionId, adminId, body.get("answerText"));
    }

    // Admin: get all questions (paginated, all products)
    @GetMapping("/admin/questions")
    public Map<String, Object> getAllQuestions(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return qandaService.getAllQuestions(page, size);
    }

    // Admin: edit answer
    @PutMapping("/answers/{id}")
    public ProductAnswerDto editAnswer(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Long adminId = ((CustomUserDetails) authentication.getPrincipal()).getUser().getId();
        return qandaService.editAnswer(id, adminId, body.get("answerText"));
    }

    // Admin: delete question (and its answers)
    @DeleteMapping("/questions/{id}")
    public void deleteQuestion(@PathVariable Long id) {
        qandaService.deleteQuestion(id);
    }

    // Edit question (customer only)
    @PutMapping("/questions/{id}/customer")
    public ProductQuestionDto editQuestionByCustomer(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Authentication authentication
    ) {
        Long userId = ((CustomUserDetails) authentication.getPrincipal()).getUser().getId();
        return qandaService.editQuestionByCustomer(id, userId, body.get("questionText"));
    }

    // Delete question (customer only)
    @DeleteMapping("/questions/{id}/customer")
    public void deleteQuestionByCustomer(
            @PathVariable Long id,
            Authentication authentication
    ) {
        Long userId = ((CustomUserDetails) authentication.getPrincipal()).getUser().getId();
        qandaService.deleteQuestionByCustomer(id, userId);
    }
}