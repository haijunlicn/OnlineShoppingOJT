package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.PaymentRejectionReasonDTO;
import com.maven.OnlineShoppingSB.dto.RejectionReasonDTO;
import com.maven.OnlineShoppingSB.service.PaymentRejectionReasonService;
import com.maven.OnlineShoppingSB.service.RejectionReasonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/payment-rejection-reason")
public class PaymentRejectionReasonController {

    @Autowired
    private PaymentRejectionReasonService service;

    @PostMapping("/create")
    // @PreAuthorize("hasAuthority('PAYMENT_REJECTION_REASON_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> create(@RequestBody PaymentRejectionReasonDTO dto) {
        service.insert(dto);
        return ResponseEntity.ok("Payment rejection reason created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<PaymentRejectionReasonDTO>> list() {
        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentRejectionReasonDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/update")
    public ResponseEntity<String> update(@RequestBody PaymentRejectionReasonDTO dto) {
        service.update(dto);
        return ResponseEntity.ok("Payment rejection reason updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok("Payment rejection reason deleted successfully!");
    }
}