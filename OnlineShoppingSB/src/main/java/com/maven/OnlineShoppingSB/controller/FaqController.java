package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maven.OnlineShoppingSB.dto.FaqDTO;
import com.maven.OnlineShoppingSB.service.FaqService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/faq")
public class FaqController {

    @Autowired
    private FaqService faqService;

    @PostMapping("/create")
    public ResponseEntity<String> insertFaq(@RequestBody FaqDTO dto) {
        faqService.insertFaq(dto);
        return ResponseEntity.ok("FAQ created successfully!");
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('FAQ_MANAGEMENT') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<FaqDTO>> getAllFaqs() {
        List<FaqDTO> dtoList = faqService.getAllFaqs();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<FaqDTO> getById(@PathVariable Long id) {
        FaqDTO dto = faqService.getById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateFaq(@RequestBody FaqDTO dto) {
        faqService.updateFaq(dto);
        return ResponseEntity.ok("FAQ updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteFaq(@PathVariable Long id) {
        faqService.deleteFaq(id);
        return ResponseEntity.ok("FAQ deleted successfully!");
    }
}
