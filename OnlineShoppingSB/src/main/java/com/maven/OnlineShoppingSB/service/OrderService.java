package com.maven.OnlineShoppingSB.service;

import com.cloudinary.utils.ObjectUtils;
import com.maven.OnlineShoppingSB.audit.Audit;
import com.maven.OnlineShoppingSB.audit.AuditEventDTO;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.helperClasses.RefundRequestMapper;
import com.maven.OnlineShoppingSB.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
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
    @Autowired
    private DiscountDisplayService discountDisplayService;
    @Autowired
    private RefundItemRepository refundItemRepository;
    @Autowired
    private RefundRequestRepository refundRequestRepository;
    @Autowired
    private ApplicationEventPublisher publisher;
    @Autowired
    private HttpServletRequest request;


    @Audit(action = "CREATE", entityType = "Order")
    @Transactional
    public OrderEntity createOrder(OrderDto dto, MultipartFile paymentProof) throws Exception {
        OrderEntity order = new OrderEntity();
        UserEntity user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UserAddressEntity address = addressRepository.findById(dto.getShippingAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));
        order.setUser(user);
        order.setUserAddress(address);
        // order.setTrackingNumber("TRK" + System.currentTimeMillis());
        order.setTrackingNumber("TRK" + System.currentTimeMillis() + (int) (Math.random() * 1000));
        order.setPaymentStatus(dto.getPaymentStatus());
        order.setTotalAmount(dto.getTotalAmount());
        order.setShippingFee(dto.getShippingFee());
        order.setCreatedDate(LocalDateTime.now());
        DeliveryMethodEntity deliveryMethod = deliveryMethodRepository.findById(dto.getDeliveryMethod().getId())
                .orElseThrow(() -> new RuntimeException("Delivery method not found"));
        order.setDeliveryMethod(deliveryMethod);
        order.setUpdatedDate(LocalDateTime.now());
        order.setOrderType(dto.getOrderType() != null ? dto.getOrderType() : OrderType.NORMAL);

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

            if (itemDto.getAppliedDiscounts() != null) {
                List<OrderItemDiscountMechanismEntity> discountEntities = itemDto.getAppliedDiscounts().stream().map(discountDto -> {
                    OrderItemDiscountMechanismEntity discount = new OrderItemDiscountMechanismEntity();
                    discount.setOrderItem(item);
                    discount.setDiscountMechanismId(discountDto.getDiscountMechanismId());
                    discount.setMechanismType(discountDto.getMechanismType());
                    discount.setDiscountType(discountDto.getDiscountType());
                    discount.setDiscountAmount(BigDecimal.valueOf(discountDto.getDiscountAmount()));
                    discount.setCouponCode(discountDto.getCouponCode());
                    discount.setDescription(discountDto.getDescription());
                    // ✅ Record usage if coupon-type (or any you want to track)
                    if (discountDto.getMechanismType() == MechanismType.Coupon) {
                        discountDisplayService.recordUsage(discountDto.getDiscountMechanismId(), dto.getUserId());
                    }
                    return discount;
                }).collect(Collectors.toList());

                item.setAppliedDiscounts(discountEntities);
            }

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
        OrderEntity savedOrder = orderRepository.save(order);
        notificationService.notifyOrderPending(
                user.getId(),
                savedOrder.getId(),
                BigDecimal.valueOf(savedOrder.getTotalAmount()),
                order.getTrackingNumber()
        );
        return savedOrder;
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
        dto.setCurrentOrderStatus(order.getCurrentStatus().getCode());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setShippingFee(order.getShippingFee());
        dto.setCreatedDate(order.getCreatedDate());
        dto.setUpdatedDate(order.getUpdatedDate());
        dto.setPaymentProofPath(order.getPaymentProofPath());
        dto.setOrderType(order.getOrderType());

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
        // userDto.setPhone(order.getUser().getPhone());
        userDto.setProfile(order.getUser().getProfile());
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
            itemDto.setMaxReturnQty(item.getQuantity() - getAlreadyReturnedOrProcessingQty(item.getId()));
            itemDto.setPrice(item.getPrice().doubleValue());
            itemDto.setTotalPrice(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).doubleValue());

            // Convert variant
            ProductVariantDTO variantDto = new ProductVariantDTO();
            variantDto.setId(item.getVariant().getId());
            variantDto.setSku(item.getVariant().getSku());
            variantDto.setPrice(BigDecimal.valueOf(item.getPrice().doubleValue()));
            variantDto.setStock(item.getVariant().getStock());
            variantDto.setImgPath(item.getVariant().getImgPath());
            // Set options from variantOptionValues
            if (item.getVariant().getVariantOptionValues() != null && !item.getVariant().getVariantOptionValues().isEmpty()) {
                List<VariantOptionDTO> optionDTOs = item.getVariant().getVariantOptionValues().stream()
                    .map(vov -> {
                        VariantOptionDTO vo = new VariantOptionDTO();
                        vo.setOptionId(vov.getOptionValue().getOption().getId());
                        vo.setOptionValueId(vov.getOptionValue().getId());
                        vo.setOptionName(vov.getOptionValue().getOption().getName());
                        vo.setValueName(vov.getOptionValue().getValue());
                        return vo;
                    })
                    .collect(Collectors.toList());
                variantDto.setOptions(optionDTOs);
            }
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

            itemDto.setAppliedDiscounts(
                    item.getAppliedDiscounts().stream().map(discount -> {
                        OrderItemRequestDTO.OrderItemDiscountMechanismDTO d = new OrderItemRequestDTO.OrderItemDiscountMechanismDTO();
                        d.setDiscountMechanismId(discount.getDiscountMechanismId());
                        d.setMechanismType(discount.getMechanismType());
                        d.setDiscountType(discount.getDiscountType());
                        d.setDiscountAmount(discount.getDiscountAmount().doubleValue());
                        d.setCouponCode(discount.getCouponCode());
                        d.setDescription(discount.getDescription());
                        return d;
                    }).collect(Collectors.toList())
            );

            return itemDto;
        }).collect(Collectors.toList());
        dto.setItems(itemDtos);

        // Convert status history if available
        if (order.getStatusHistoryList() != null) {
            List<OrderStatusHistoryDto> statusDtos = order.getStatusHistoryList().stream().map(status -> {
                OrderStatusHistoryDto statusDto = new OrderStatusHistoryDto();
                statusDto.setStatusId(status.getStatus().getId());
                statusDto.setStatusCode(status.getStatus().getCode());
                statusDto.setNote(status.getNote());
                statusDto.setCreatedAt(status.getCreatedAt());
                statusDto.setUpdatedBy(status.getUpdatedBy());

                // ✅ Convert full status entity
                OrderStatusHistoryDto.OrderStatusDto statusMeta = new OrderStatusHistoryDto.OrderStatusDto();
                statusMeta.setId(status.getStatus().getId());
                statusMeta.setCode(status.getStatus().getCode());
                statusMeta.setDisplayOrder(status.getStatus().getDisplayOrder());
                statusMeta.setIsFailure(status.getStatus().getIsFailure());
                statusMeta.setIsFinal(status.getStatus().getIsFinal());
                statusMeta.setLabel(status.getStatus().getLabel());

                statusDto.setStatus(statusMeta); // ✅ attach
                return statusDto;
            }).collect(Collectors.toList());
            dto.setStatusHistory(statusDtos);
        }

        return dto;
    }

    @Audit(action = "BULK_UPDATE_STATUS", entityType = "Order")
    @Transactional
    public List<OrderEntity> bulkUpdateOrderStatus(BulkOrderStatusUpdateRequest request, UserEntity adminUser) {
        
        List<OrderEntity> updatedOrders = new ArrayList<>();

        for (Long orderId : request.getOrderIds()) {
            OrderEntity order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            OrderStatusTypeEntity statusType = orderStatusTypeRepository
                    .findByCode(request.getStatusCode())
                    .orElseThrow(() -> new RuntimeException("Status not found: " + request.getStatusCode()));

            // ✅ Set current status
            order.setCurrentStatus(statusType);
            order.setUpdatedDate(LocalDateTime.now());

            // 🔁 ROLLBACK stock if ORDER_CANCELLED
            if ("ORDER_CANCELLED".equalsIgnoreCase(request.getStatusCode())) {
                for (OrderItemEntity item : order.getItems()) {
                    ProductVariantEntity variant = item.getVariant();
                    if (variant != null) {
                        variant.setStock(variant.getStock() + item.getQuantity());
                        variantRepository.save(variant);
                    }
                }
            }
            // ✅ Create and add order status history
            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(statusType);
            history.setNote(request.getNote());
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedBy(request.getUpdatedBy());
            history.setUpdatedBy(adminUser.getId());

            if (order.getStatusHistoryList() == null) {
                order.setStatusHistoryList(new ArrayList<>());
            }
            order.getStatusHistoryList().add(history);

            OrderEntity savedOrder = orderRepository.save(order);
            updatedOrders.add(savedOrder);

            // *** Add notification call ***
            Long userId = savedOrder.getUser().getId(); // get order's user id
         
            System.out.println(userId);
            System.out.println(savedOrder);
            System.out.println(request.getStatusCode());
            notificationService.notifyOrderStatusUpdate(userId, savedOrder.getId(), request.getStatusCode(),order.getTrackingNumber());
        }

        return updatedOrders;
    }

    @Audit(action = "UPDATE_PAYMENT_STATUS", entityType = "Order")
    @Transactional
    public OrderDetailDto updatePaymentStatus(
            Long orderId,
            String newStatus,
            UserEntity adminUser,
            PaymentRejectionReasonDTO.PaymentRejectionRequestDTO rejectionRequest,
            PaymentStatusUpdateAuditDto auditDto  // <-- add this here
    ) {
        OrderEntity order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        PaymentStatus status;
        try {
            status = PaymentStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid payment status: " + newStatus);
        }

        // Prepare rejection details map (empty if none)
        Map<String, Object> rejectionDetails = new HashMap<>();
        if (rejectionRequest != null) {
            rejectionDetails.put("reasonId", rejectionRequest.getReasonId());
            rejectionDetails.put("customReason", rejectionRequest.getCustomReason());
        }
        Long adminUserId = adminUser != null ? adminUser.getId() : null;

        if (status == PaymentStatus.FAILED) {
            // --- Validation ---
            if (adminUser == null) throw new IllegalArgumentException("Admin user is required for payment rejection");

            Long userId = order.getUser().getId();
    System.out.println("May_______________________________________________________________________ordercancelled");
           //notificationService.notifyOrderStatusUpdate(userId, order.getId(), "ORDER_CANCELLED",order.getTrackingNumber());

            if (order.getPaymentStatus() != PaymentStatus.PENDING) {
                throw new IllegalStateException("Only pending payments can be rejected.");
            }

            if (rejectionRequest == null) {
                throw new IllegalArgumentException("Rejection reason is required.");
            }

            PaymentRejectionReasonEntity reasonEntity = null;

            if (rejectionRequest.getReasonId() != null) {
                reasonEntity = paymentRejectionReasonRepository.findById(rejectionRequest.getReasonId())
                        .orElseThrow(() -> new IllegalArgumentException("Rejection reason not found"));
            }

            if (reasonEntity == null && (rejectionRequest.getCustomReason() == null || rejectionRequest.getCustomReason().isBlank())) {
                throw new IllegalArgumentException("Custom rejection reason is required if no predefined reason is selected.");
            }

            if (reasonEntity != null && reasonEntity.getAllowCustomText() &&
                    (rejectionRequest.getCustomReason() == null || rejectionRequest.getCustomReason().isBlank())) {
                throw new IllegalArgumentException("Custom reason is required for the selected rejection reason.");
            }

            PaymentRejectionLogEntity rejectionLog = new PaymentRejectionLogEntity();
            rejectionLog.setOrder(order);

            if (rejectionRequest.getReasonId() != null) {
                PaymentRejectionReasonEntity reason = paymentRejectionReasonRepository.findById(rejectionRequest.getReasonId())
                        .orElseThrow(() -> new IllegalArgumentException("Rejection reason not found"));
                rejectionLog.setReason(reason);
            }

            rejectionLog.setCustomReason(rejectionRequest.getCustomReason());
            rejectionLog.setRejectedBy(adminUser);
            rejectionLog.setRejectedAt(LocalDateTime.now());
            paymentRejectionLogRepository.save(rejectionLog);

            OrderStatusTypeEntity cancelledStatus = orderStatusTypeRepository.findByCode("ORDER_CANCELLED")
                    .orElseThrow(() -> new RuntimeException("Status 'ORDER_CANCELLED' not found"));

            order.setCurrentStatus(cancelledStatus);

            Map<String, Object> metadata = new HashMap<>();
            metadata.put("orderId", order.getId());
            String reasonText = rejectionRequest.getCustomReason();
            if ((reasonText == null || reasonText.isBlank()) && reasonEntity != null) {
                reasonText = reasonEntity.getLabel();
            }
            metadata.put("reason", reasonText);
            notificationService.notify("PAYMENT_CANCELLED", metadata, List.of(userId));

            // notificationService.sendNamedNotification("PAYMENT_CANCELLED", metadata, List.of(userId));

            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(cancelledStatus);
            history.setNote("Payment rejected by admin: " +
                    (rejectionRequest.getCustomReason() != null ? rejectionRequest.getCustomReason() : "Reason #" + rejectionRequest.getReasonId()));
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedBy(adminUser.getId());
            orderStatusHistoryRepository.save(history);

            for (OrderItemEntity item : order.getItems()) {
                ProductVariantEntity variant = item.getVariant();
                if (variant != null) {
                    int currentStock = variant.getStock();
                    variant.setStock(currentStock + item.getQuantity());
                    variantRepository.save(variant);
                }
            }
        }

        if (status == PaymentStatus.PAID) {
            OrderStatusTypeEntity confirmedStatus = orderStatusTypeRepository.findByCode("ORDER_CONFIRMED")
                    .orElseThrow(() -> new RuntimeException("ORDER_CONFIRMED status not found"));

            order.setCurrentStatus(confirmedStatus);

            Long userId = order.getUser().getId();
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("orderId", order.getId());
           //notificationService.notify("ORDER_CONFIRMED", metadata, List.of(userId));
            notificationService.notifyOrderStatusUpdate(userId,orderId,"ORDER_CONFIRMED",order.getTrackingNumber());
            //  notificationService.sendNamedNotification("ORDER_CONFIRMED", metadata, List.of(userId));

            OrderStatusHistoryEntity history = new OrderStatusHistoryEntity();
            history.setOrder(order);
            history.setStatus(confirmedStatus);
            history.setNote("Payment approved, status set to ORDER_CONFIRMED");
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedBy(adminUser != null ? adminUser.getId() : 1L);
            orderStatusHistoryRepository.save(history);

            for (OrderItemEntity item : order.getItems()) {
                ProductVariantEntity variant = item.getVariant();
                if (variant != null) {
                    notificationService.checkAndNotifyLowStock(variant);
                    notificationService.checkAndNotifyOutOfStock(variant);
                }
            }
        }

        order.setPaymentStatus(status);
        order.setUpdatedDate(LocalDateTime.now());
        orderRepository.save(order);

        return convertToOrderDetailDto(order);
    }

    // New method to fetch all orders for admin
    public List<OrderEntity> getAllOrders() {
        return orderRepository.findByDeletedFalseOrderByCreatedDateDesc();
    }

    public int getAlreadyReturnedOrProcessingQty(Long orderItemId) {
        List<RefundItemStatus> excluded = List.of(
                RefundItemStatus.REJECTED,
                RefundItemStatus.RETURN_REJECTED
        );
        return refundItemRepository.sumReturnedQuantityByOrderItemId(orderItemId, excluded);
    }

    /**
     * Returns a list of user stats (order count and total spent) for all users.
     */
    public List<UserStatsDTO> getAllUserStats() {
        List<UserEntity> users = userRepository.findAll();
        List<UserStatsDTO> stats = new ArrayList<>();
        for (UserEntity user : users) {
            UserStatsDTO dto = new UserStatsDTO();
            dto.setUserId(user.getId());
            Long orderCount = orderRepository.countCompletedOrdersByUser(user.getId());
            dto.setOrderCount(orderCount != null ? orderCount : 0L);
            BigDecimal totalSpent = orderRepository.sumTotalPaidByUser(user.getId());
            dto.setTotalSpent(totalSpent != null ? totalSpent.doubleValue() : 0.0);
            stats.add(dto);
        }
        return stats;
    }
}