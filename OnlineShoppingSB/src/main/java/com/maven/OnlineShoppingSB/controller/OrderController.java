package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.OrderEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.service.OrderService;
import com.maven.OnlineShoppingSB.service.RefundRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"},
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class OrderController {

    @Autowired
    private OrderService orderService;
    @Autowired
    private RefundRequestService refundRequestService;

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(
            @RequestPart("order") OrderDto dto,
            @RequestPart(value = "paymentImage", required = false) MultipartFile paymentImage
    ) {
        try {
            System.out.println("order req : " + dto);
            OrderEntity order = orderService.createOrder(dto, paymentImage);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            System.err.println("Error creating order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error creating order: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderDetailDto>> getOrdersByUserId(@PathVariable Long userId) {
        try {
            List<OrderEntity> orders = orderService.getOrdersByUserId(userId);
            System.out.println("user Id : " + userId);
            List<OrderDetailDto> orderListDTO = orders.stream()
                    .map(orderService::convertToOrderDetailDto)
                    .collect(Collectors.toList());
            System.out.println("orders : " + orderListDTO);
            return ResponseEntity.ok(orderListDTO);
        } catch (Exception e) {
            System.err.println("Error getting orders: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderDetailDto> getOrderById(@PathVariable Long orderId) {
        try {
            OrderEntity order = orderService.getOrderById(orderId);
            return ResponseEntity.ok(orderService.convertToOrderDetailDto(order));
        } catch (Exception e) {
            System.err.println("Error getting order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}/details")
    @PreAuthorize("hasAuthority('ORDER_DETAIL') or hasRole('SUPERADMIN')")
    public ResponseEntity<OrderDetailDto> getOrderByIdWithDetails(@PathVariable Long orderId) {
        try {
            OrderEntity order = orderService.getOrderByIdWithDetails(orderId);
            OrderDetailDto dto = orderService.convertToOrderDetailDto(order);

            // Use simplified refund mapping
            List<RefundRequestAdminDTO> refunds = refundRequestService.getRefundsForOrderDetailPage(orderId);
            dto.setRefunds(refunds);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error getting order details: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    @GetMapping("/public/{orderId}/details")

    public ResponseEntity<OrderDetailDto> getPublicOrderByIdWithDetails(@PathVariable Long orderId) {
        try {
            OrderEntity order = orderService.getOrderByIdWithDetails(orderId);
            OrderDetailDto dto = orderService.convertToOrderDetailDto(order);

            // Use simplified refund mapping
            List<RefundRequestAdminDTO> refunds = refundRequestService.getRefundsForOrderDetailPage(orderId);
            dto.setRefunds(refunds);

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            System.err.println("Error getting order details: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    @PostMapping("/admin/bulk-status")
    @PreAuthorize("hasAuthority('ORDER_UPDATE_STATUS') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<OrderDetailDto>> bulkUpdateOrderStatus(@RequestBody BulkOrderStatusUpdateRequest request) {
        try {
            List<OrderEntity> updatedOrders = orderService.bulkUpdateOrderStatus(request);
            List<OrderDetailDto> updatedOrderDtos = updatedOrders.stream()
                    .map(orderService::convertToOrderDetailDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(updatedOrderDtos);
        } catch (Exception e) {
            System.err.println("Error updating order status: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("")
    public ResponseEntity<List<OrderDetailDto>> getAllOrders() {
        try {
            List<OrderEntity> orders = orderService.getAllOrders();
            List<OrderDetailDto> orderDtos = orders.stream()
                    .map(orderService::convertToOrderDetailDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(orderDtos);
        } catch (Exception e) {
            System.err.println("Error getting all orders: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/user-stats")
    public ResponseEntity<List<UserStatsDTO>> getAllUserStats() {
        List<UserStatsDTO> stats = orderService.getAllUserStats();
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/{id}/payment-status")
    @PreAuthorize("hasAuthority('ORDER_UPDATE') or hasRole('SUPERADMIN')")

    public ResponseEntity<?> updatePaymentStatus(
            @PathVariable Long id,
            @RequestBody PaymentRejectionReasonDTO.PaymentStatusUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails principal
    ) {
        try {
            String newStatus = request.getStatus();
            UserEntity adminUser = principal != null ? principal.getUser() : null;
            PaymentRejectionReasonDTO.PaymentRejectionRequestDTO rejectionRequest = request.getRejectionRequest();

            // Build audit DTO here
            Map<String, Object> rejectionDetails = new HashMap<>();
            if (rejectionRequest != null) {
                rejectionDetails.put("reasonId", rejectionRequest.getReasonId());
                rejectionDetails.put("customReason", rejectionRequest.getCustomReason());
            }
            Long adminUserId = adminUser != null ? adminUser.getId() : null;

            PaymentStatusUpdateAuditDto auditDto = new PaymentStatusUpdateAuditDto(id, newStatus, adminUserId, rejectionDetails);

            // Pass audit DTO to service
            OrderDetailDto updatedDto = orderService.updatePaymentStatus(id, newStatus, adminUser, rejectionRequest, auditDto);
            return ResponseEntity.ok(updatedDto);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

}
