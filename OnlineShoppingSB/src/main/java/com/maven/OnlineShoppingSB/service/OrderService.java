package com.maven.OnlineShoppingSB.service;

import com.cloudinary.utils.ObjectUtils;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.OrderRepository;
import com.maven.OnlineShoppingSB.repository.ProductVariantRepository;
import com.maven.OnlineShoppingSB.repository.UserAddressRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.repository.DeliveryMethodRepository;
import com.maven.OnlineShoppingSB.repository.OrderStatusTypeRepository;
import com.maven.OnlineShoppingSB.repository.OrderStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserAddressRepository addressRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private DeliveryMethodRepository deliveryMethodRepository;

    @Autowired
    private OrderStatusTypeRepository orderStatusTypeRepository;

    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    public OrderEntity createOrder(OrderDto dto, MultipartFile paymentProof) throws Exception {
        OrderEntity order = new OrderEntity();
        UserEntity user = userRepository.findById(dto.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserAddressEntity address = addressRepository.findById(dto.getShippingAddressId())
            .orElseThrow(() -> new RuntimeException("Address not found"));
        order.setUser(user);
        order.setUserAddress(address);
        order.setTrackingNumber("TRK" + System.currentTimeMillis());
        order.setPaymentStatus(dto.getPaymentStatus());
        order.setTotalAmount(dto.getTotalAmount());
        order.setShippingFee(dto.getShippingFee());
        order.setCreatedDate(LocalDateTime.now());
        DeliveryMethodEntity deliveryMethod = deliveryMethodRepository.findById(dto.getDeliveryMethod().getId())
            .orElseThrow(() -> new RuntimeException("Delivery method not found"));
        order.setDeliveryMethod(deliveryMethod);
        order.setUpdatedDate(LocalDateTime.now());

        if (paymentProof != null && !paymentProof.isEmpty()) {
            String imageUrl = cloudinaryService.uploadFile(paymentProof);
            order.setPaymentProofPath(imageUrl);
        }
        System.out.println("Order Data "+order);
        List<OrderItemEntity> items = dto.getItems().stream().map(itemDto -> {
            OrderItemEntity item = new OrderItemEntity();
            ProductVariantEntity variant = variantRepository.findById(itemDto.getVariantId())
                .orElseThrow(() -> new RuntimeException("Variant not found"));
            item.setVariant(variant);
            item.setQuantity(itemDto.getQuantity());
            item.setPrice(BigDecimal.valueOf(itemDto.getPrice()));
            item.setOrder(order);
            return item;
        }).collect(Collectors.toList());

        order.setItems(items);

        return orderRepository.save(order);
    }

    // Get all orders for a user
    public List<OrderEntity> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserIdAndDeletedFalse(userId);
    }

    // Get order by ID
    public OrderEntity getOrderById(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // Get order by ID with all details
    public OrderEntity getOrderByIdWithDetails(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // Convert OrderEntity to OrderDetailDto
    public OrderDetailDto convertToOrderDetailDto(OrderEntity order) {
        OrderDetailDto dto = new OrderDetailDto();
        dto.setId(order.getId().longValue());
        dto.setTrackingNumber(order.getTrackingNumber());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedDate(order.getCreatedDate());
        dto.setUpdatedDate(order.getUpdatedDate());
        dto.setPaymentProofPath(order.getPaymentProofPath());

        // Convert user
        userDTO userDto = new userDTO();
        userDto.setId(order.getUser().getId());
        userDto.setName(order.getUser().getName());
        userDto.setEmail(order.getUser().getEmail());
        userDto.setPhone(order.getUser().getPhone());
        dto.setUser(userDto);

        // Convert shipping address
        UserAddressDto addressDto = new UserAddressDto();
        addressDto.setId(order.getUserAddress().getId());
        addressDto.setAddress(order.getUserAddress().getAddress());
        addressDto.setCity(order.getUserAddress().getCity());
        addressDto.setTownship(order.getUserAddress().getTownship());
        addressDto.setZipcode(order.getUserAddress().getZipcode());
        addressDto.setCountry(order.getUserAddress().getCountry());
        addressDto.setLatitude(order.getUserAddress().getLatitude());
        addressDto.setLongitude(order.getUserAddress().getLongitude());
        dto.setShippingAddress(addressDto);

        // Convert delivery method
        DeliveryMethodDto deliveryMethodDto = new DeliveryMethodDto();
        deliveryMethodDto.setId(order.getDeliveryMethod().getId());
        deliveryMethodDto.setName(order.getDeliveryMethod().getName());
        deliveryMethodDto.setBaseFee(order.getDeliveryMethod().getBaseFee());
        deliveryMethodDto.setFeePerKm(order.getDeliveryMethod().getFeePerKm());
        dto.setDeliveryMethod(deliveryMethodDto);

        // Convert order items
        List<OrderItemDetailDto> itemDtos = order.getItems().stream().map(item -> {
            OrderItemDetailDto itemDto = new OrderItemDetailDto();
            itemDto.setId(item.getId());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setPrice(item.getPrice().doubleValue());
            itemDto.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).doubleValue());

            // Convert variant
            ProductVariantDTO variantDto = new ProductVariantDTO();
            variantDto.setId(item.getVariant().getId());
            variantDto.setSku(item.getVariant().getSku());
            variantDto.setPrice(BigDecimal.valueOf(item.getPrice().doubleValue()));
            variantDto.setStock(item.getVariant().getStock());
            variantDto.setImgPath(item.getVariant().getImgPath());
            itemDto.setVariant(variantDto);

            // Convert product
            ProductDTO productDto = new ProductDTO();
            productDto.setId(item.getVariant().getProduct().getId());
            productDto.setName(item.getVariant().getProduct().getName());
            productDto.setDescription(item.getVariant().getProduct().getDescription());
            
            // Convert ProductImageEntity list to ProductImageDTO list
            List<ProductImageDTO> productImageDtos = item.getVariant().getProduct().getProductImages().stream()
                .map(imageEntity -> {
                    ProductImageDTO imageDto = new ProductImageDTO();
                    imageDto.setId(imageEntity.getId());
                    imageDto.setProductId(imageEntity.getProduct().getId());
                    imageDto.setImgPath(imageEntity.getImgPath());
                    imageDto.setDisplayOrder(imageEntity.getDisplayOrder());
                    imageDto.setMainImageStatus(imageEntity.isMainImageStatus());
                    imageDto.setAltText(imageEntity.getAltText());
                    imageDto.setCreatedDate(imageEntity.getCreatedDate());
                    return imageDto;
                })
                .collect(Collectors.toList());
            productDto.setProductImages(productImageDtos);
            
            productDto.setCreatedDate(item.getVariant().getProduct().getCreatedDate());
            itemDto.setProduct(productDto);

            return itemDto;
        }).collect(Collectors.toList());
        dto.setItems(itemDtos);

        // Convert status history if available
        if (order.getStatusHistoryList() != null) {
            List<OrderStatusHistoryDto> statusDtos = order.getStatusHistoryList().stream().map(status -> {
                OrderStatusHistoryDto statusDto = new OrderStatusHistoryDto();
                statusDto.setId(status.getId());
                statusDto.setOrderId(status.getOrder().getId().longValue());
                statusDto.setStatusId(status.getStatus().getId());
                statusDto.setNote(status.getNote());
                statusDto.setCreatedAt(status.getCreatedAt());
                statusDto.setUpdatedBy(status.getUpdatedBy());
                return statusDto;
            }).collect(Collectors.toList());
            dto.setStatusHistory(statusDtos);
        }

        return dto;
    }

    public void bulkUpdateOrderStatus(BulkOrderStatusUpdateRequest request) {
        for (Long orderId : request.getOrderIds()) {
            OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            // Update order status (e.g., paymentStatus field)
            OrderStatusTypeEntity statusType = orderStatusTypeRepository.findById(request.getStatusId())
                .orElseThrow(() -> new RuntimeException("Status not found: " + request.getStatusId()));
            order.setPaymentStatus(statusType.getCode());
            order.setUpdatedDate(java.time.LocalDateTime.now());
            orderRepository.save(order);

            // Add to order_status_history
            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(statusType);
            history.setNote(request.getNote());
            history.setCreatedAt(java.time.LocalDateTime.now());
            history.setUpdatedBy(request.getUpdatedBy());
            orderStatusHistoryRepository.save(history);
        }
    }

    // New method to fetch all orders for admin
    public List<OrderEntity> getAllOrders() {
        return orderRepository.findByDeletedFalseOrderByCreatedDateDesc();
    }
}