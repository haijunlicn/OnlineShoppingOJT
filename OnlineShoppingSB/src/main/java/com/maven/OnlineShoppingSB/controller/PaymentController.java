package com.maven.OnlineShoppingSB.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.PaymentDTO;
import com.maven.OnlineShoppingSB.service.PaymentService;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/payment-method")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<PaymentDTO> createPaymentMethod(@RequestBody PaymentDTO dto) {
        PaymentDTO created = paymentService.createPaymentMethod(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/list")
    public ResponseEntity<List<PaymentDTO>> getAllPaymentMethods() {
        List<PaymentDTO> dtoList = paymentService.getAllPaymentMethods();
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<PaymentDTO> getPaymentMethodById(@PathVariable int id) {
        PaymentDTO dto = paymentService.getPaymentMethodById(id);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<PaymentDTO> updatePaymentMethod(@PathVariable int id, @RequestBody PaymentDTO dto) {
        PaymentDTO updated = paymentService.updatePaymentMethod(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deletePaymentMethod(@PathVariable int id) {
        paymentService.deletePaymentMethod(id);
        return ResponseEntity.ok("Payment method deleted successfully!");
    }
}
