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
@CrossOrigin(origins = "http://localhost:4200")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public OrderEntity createOrder(
            @RequestPart("order") OrderDto dto,
            @RequestPart(value = "paymentImage", required = false) MultipartFile paymentImage
    ) throws Exception {
        System.out.println("order req : " + dto);
        return orderService.createOrder(dto, paymentImage);
    }

    @GetMapping("/user/{userId}")
    public List<OrderDetailDto> getOrdersByUserId(@PathVariable Long userId) {
        List<OrderEntity> orders = orderService.getOrdersByUserId(userId);
        System.out.println("user Id : " + userId);
        List<OrderDetailDto> orderListDTO = orders.stream()
                .map(orderService::convertToOrderDetailDto)
                .collect(Collectors.toList());
        System.out.println("orders : " + orderListDTO);
        return orderListDTO;
    }

    @GetMapping("/{orderId}")
    public OrderDetailDto getOrderById(@PathVariable Long orderId) {
        OrderEntity order = orderService.getOrderById(orderId);
        return orderService.convertToOrderDetailDto(order);
    }

    @GetMapping("/{orderId}/details")
    public OrderDetailDto getOrderByIdWithDetails(@PathVariable Long orderId) {
        OrderEntity order = orderService.getOrderByIdWithDetails(orderId);
        System.out.println("order detail : " + orderService.convertToOrderDetailDto(order));
        return orderService.convertToOrderDetailDto(order);
    }

    @PostMapping("/admin/bulk-status")
    public ResponseEntity<?> bulkUpdateOrderStatus(@RequestBody BulkOrderStatusUpdateRequest request) {
        orderService.bulkUpdateOrderStatus(request);
        return ResponseEntity.ok("Order statuses updated successfully");
    }

    @GetMapping("")
    public List<OrderDetailDto> getAllOrders() {
        List<OrderEntity> orders = orderService.getAllOrders();
        return orders.stream()
                .map(orderService::convertToOrderDetailDto)
                .collect(Collectors.toList());
    }
}
