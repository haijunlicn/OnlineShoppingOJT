package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.RefundReasonDTO;
import com.maven.OnlineShoppingSB.dto.RefundRequestAdminDTO;
import com.maven.OnlineShoppingSB.dto.RefundRequestDTO;
import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import com.maven.OnlineShoppingSB.service.RefundReasonService;
import com.maven.OnlineShoppingSB.service.RefundRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/refund-requests")
public class RefundRequestController {

    @Autowired
    private RefundRequestService refundRequestService;

    @PostMapping("/create")
    public ResponseEntity<?> createRefundRequest(@RequestBody RefundRequestDTO dto) {
        try {
            if (dto.getUserId() == null) {
                return ResponseEntity.badRequest().body("userId is required");
            }
            RefundRequestEntity savedRequest = refundRequestService.createRefundRequest(dto.getUserId(), dto);
            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create refund request: " + e.getMessage());
        }
    }

    @GetMapping("/list")
    public ResponseEntity<List<RefundRequestAdminDTO>> getAllRefundRequests() {
        List<RefundRequestAdminDTO> reqList = refundRequestService.getAllForAdmin();
        System.out.println("req list : " + reqList);
        return ResponseEntity.ok(reqList);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRefundRequestDetail(@PathVariable Long id) {
        try {
            RefundRequestAdminDTO dto = refundRequestService.getRefundRequestDetail(id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to fetch refund request detail: " + e.getMessage());
        }
    }

    @PostMapping("/review-items")
    public ResponseEntity<Void> reviewRefundItems(@RequestBody RefundRequestDTO.ReviewBatchRequestDTO request) {
        Long adminId = request.getAdminId(); // from payload
        System.out.println("batch request : " + request);
        refundRequestService.reviewRefundItems(adminId, request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/update-status")
    public ResponseEntity<?> updateItemStatus(@RequestBody RefundRequestDTO.StatusUpdateRequest request) {
        try {
            refundRequestService.updateItemStatus(request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to update item status: " + e.getMessage());
        }
    }


}