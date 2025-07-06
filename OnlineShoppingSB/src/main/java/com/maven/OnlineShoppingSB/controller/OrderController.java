package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.BulkOrderStatusUpdateRequest;
import com.maven.OnlineShoppingSB.dto.OrderDetailDto;
import com.maven.OnlineShoppingSB.dto.OrderDto;
import com.maven.OnlineShoppingSB.entity.OrderEntity;
import com.maven.OnlineShoppingSB.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:4200", "http://127.0.0.1:4200"}, 
             allowedHeaders = "*", 
             methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class OrderController {

    @Autowired
    private OrderService orderService;

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
    public ResponseEntity<OrderDetailDto> getOrderByIdWithDetails(@PathVariable Long orderId) {
        try {
            OrderEntity order = orderService.getOrderByIdWithDetails(orderId);
            return ResponseEntity.ok(orderService.convertToOrderDetailDto(order));
        } catch (Exception e) {
            System.err.println("Error getting order details: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/admin/bulk-status")
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
}
