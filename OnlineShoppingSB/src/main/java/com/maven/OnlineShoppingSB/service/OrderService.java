package com.maven.OnlineShoppingSB.service;

import com.cloudinary.utils.ObjectUtils;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private PaymentRejectionReasonRepository paymentRejectionReasonRepository;

    @Autowired
    private PaymentRejectionLogRepository paymentRejectionLogRepository;

    @Autowired
    private NotificationService notificationService;

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

        // Handle payment proof upload with error handling
        if (paymentProof != null && !paymentProof.isEmpty()) {
            try {
                String imageUrl = cloudinaryService.uploadFile(paymentProof);
                order.setPaymentProofPath(imageUrl);
                System.out.println("Payment proof uploaded successfully: " + imageUrl);
            } catch (Exception e) {
                System.err.println("Failed to upload payment proof to Cloudinary: " + e.getMessage());
                // Fallback: save locally or continue without payment proof
                try {
                    // Save to local directory as fallback
                    String fileName = "payment_proof_" + System.currentTimeMillis() + ".jpg";
                    String localPath = "uploads/payment_proofs/" + fileName;
                    java.nio.file.Files.createDirectories(java.nio.file.Paths.get("uploads/payment_proofs"));
                    java.nio.file.Files.write(java.nio.file.Paths.get(localPath), paymentProof.getBytes());
                    order.setPaymentProofPath("file://" + localPath);
                    System.out.println("Payment proof saved locally: " + localPath);
                } catch (Exception localError) {
                    System.err.println("Failed to save payment proof locally: " + localError.getMessage());
                    // Continue without payment proof - don't fail the entire order
                    order.setPaymentProofPath(null);
                }
            }
        }

        if (dto.getPaymentMethodId() != null) {
            PaymentEntity paymentMethod = paymentMethodRepository.findById(dto.getPaymentMethodId().intValue())
                    .orElseThrow(() -> new RuntimeException("Payment method not found"));
            order.setPaymentMethod(paymentMethod);
        }

        System.out.println("Order Data " + order);
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

        OrderStatusTypeEntity initialStatus = orderStatusTypeRepository.findByCode("ORDER_PENDING")
                .orElseThrow(() -> new RuntimeException("Initial order status not found"));
        order.setCurrentStatus(initialStatus);

        // -- Add to status history
        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrder(order);
        history.setStatus(initialStatus);
        history.setCreatedAt(LocalDateTime.now());
        history.setNote("Order placed and awaiting payment verification."); // Optional
        history.setUpdatedBy(dto.getUserId()); // Assuming user placed the order
        order.setStatusHistoryList(List.of(history));

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

        // Convert payment method if exists
        if (order.getPaymentMethod() != null) {
            PaymentDTO paymentDto = new PaymentDTO();
            paymentDto.setId(order.getPaymentMethod().getId());
            paymentDto.setMethodName(order.getPaymentMethod().getMethodName());
            paymentDto.setDescription(order.getPaymentMethod().getDescription());
            paymentDto.setType(order.getPaymentMethod().getType());
            paymentDto.setLogo(order.getPaymentMethod().getLogo());
            paymentDto.setQrPath(order.getPaymentMethod().getQrPath());
            paymentDto.setStatus(order.getPaymentMethod().getStatus());
            dto.setPaymentMethod(paymentDto);
        }

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
        addressDto.setPhoneNumber(order.getUserAddress().getPhoneNumber());
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

    public List<OrderEntity> bulkUpdateOrderStatus(BulkOrderStatusUpdateRequest request) {
        List<OrderEntity> updatedOrders = new ArrayList<>();

        for (Long orderId : request.getOrderIds()) {
            OrderEntity order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            OrderStatusTypeEntity statusType = orderStatusTypeRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new RuntimeException("Status not found: " + request.getStatusId()));

            // ✅ Set current status (not payment status)
            order.setCurrentStatus(statusType);
            order.setUpdatedDate(java.time.LocalDateTime.now());

            // ✅ Create and add order status history
            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(statusType);
            history.setNote(request.getNote());
            history.setCreatedAt(java.time.LocalDateTime.now());
            history.setUpdatedBy(request.getUpdatedBy());

            // Append to history list to trigger cascade save
            if (order.getStatusHistoryList() == null) {
                order.setStatusHistoryList(new ArrayList<>());
            }
            order.getStatusHistoryList().add(history);

            // ✅ Save the order (which cascades the history too)
            updatedOrders.add(orderRepository.save(order));
        }

        return updatedOrders;
    }

    @Transactional
    public OrderEntity updatePaymentStatus(Long orderId, String newStatus) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        PaymentStatus status;
        try {
            status = PaymentStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid payment status: " + newStatus);
        }

        order.setPaymentStatus(status);
        order.setUpdatedDate(LocalDateTime.now());

        // Handle status transitions
        if (status == PaymentStatus.PAID) {
            // Set initial status to ORDER_CONFIRMED
            OrderStatusTypeEntity confirmedStatus = orderStatusTypeRepository.findByCode("ORDER_CONFIRMED")
                    .orElseThrow(() -> new RuntimeException("ORDER_CONFIRMED status not found"));

            order.setCurrentStatus(confirmedStatus);

            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(confirmedStatus);
            history.setNote("Payment approved, status set to ORDER_CONFIRMED");
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedBy(1L); // Replace with actual admin ID

            orderStatusHistoryRepository.save(history);
        } else if (status == PaymentStatus.FAILED) {
            // Set status to CANCELLED
            OrderStatusTypeEntity cancelledStatus = orderStatusTypeRepository.findByCode("CANCELLED")
                    .orElseThrow(() -> new RuntimeException("CANCELLED status not found"));

            order.setCurrentStatus(cancelledStatus);

            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(cancelledStatus);
            history.setNote("Payment failed, order cancelled");
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedBy(1L); // Replace with actual admin ID

            orderStatusHistoryRepository.save(history);
        }

        return orderRepository.save(order);
    }

    // New method to fetch all orders for admin
    public List<OrderEntity> getAllOrders() {
        return orderRepository.findByDeletedFalseOrderByCreatedDateDesc();
    }

    @Transactional
    public OrderDetailDto rejectPayment(
            Long orderId,
            PaymentRejectionReasonDTO.PaymentRejectionRequestDTO request,
            UserEntity adminUser
    ) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new IllegalStateException("Only pending payments can be rejected.");
        }

        // --- Validate Reason ---
        if (request.getReasonId() == null && (request.getCustomReason() == null || request.getCustomReason().isBlank())) {
            throw new IllegalArgumentException("Rejection reason is required.");
        }

        // --- Save Payment Status Update ---
        order.setPaymentStatus(PaymentStatus.FAILED); // Assuming enum
        order.setUpdatedDate(LocalDateTime.now());
        orderRepository.save(order);

        // --- Save Rejection Reason (in separate table) ---
        PaymentRejectionLogEntity rejectionLog = new PaymentRejectionLogEntity();
        rejectionLog.setOrder(order);

        if (request.getReasonId() != null) {
            PaymentRejectionReasonEntity reason = paymentRejectionReasonRepository.findById(request.getReasonId())
                    .orElseThrow(() -> new IllegalArgumentException("Rejection reason not found"));
            rejectionLog.setReason(reason);
        }

        rejectionLog.setCustomReason(request.getCustomReason());
        rejectionLog.setRejectedBy(adminUser);
        rejectionLog.setRejectedAt(LocalDateTime.now());

        paymentRejectionLogRepository.save(rejectionLog);


        // --- Save Order Status History (optional but recommended) ---
        OrderStatusTypeEntity cancelledStatus = orderStatusTypeRepository.findByCode("ORDER_CANCELLED")
                .orElseThrow(() -> new RuntimeException("Status 'ORDER_CANCELLED' not found"));

        OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
        history.setOrder(order);
        history.setStatus(cancelledStatus);
        history.setNote("Payment rejected by admin: " +
                (request.getCustomReason() != null ? request.getCustomReason() : "Reason #" + request.getReasonId()));
        history.setCreatedAt(LocalDateTime.now());
        history.setUpdatedBy(adminUser.getId());
        orderStatusHistoryRepository.save(history);

        return convertToOrderDetailDto(order);
    }

}