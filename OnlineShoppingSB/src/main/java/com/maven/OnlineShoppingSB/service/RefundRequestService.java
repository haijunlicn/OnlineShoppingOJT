package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.*;
import com.maven.OnlineShoppingSB.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class RefundRequestService {

    private final RefundRequestRepository refundRequestRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final RefundReasonRepository refundReasonRepository;
    private final UserRepository userRepository; // to get current user (or pass userId)

    @Autowired
    private OrderService orderService;
    @Autowired
    private RefundStatusHistoryRepository refundStatusHistoryRepository;
    @Autowired
    private RefundItemStatusHistoryRepository refundItemStatusHistoryRepository;
    @Autowired
    private RefundItemRepository refundItemRepository;
    @Autowired
    private RejectionReasonRepository rejectionReasonRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private OrderStatusTypeRepository orderStatusTypeRepository;
    @Autowired
    private OrderStatusHistoryRepository orderStatusHistoryRepository;
    @Autowired
    private ProductVariantRepository variantRepository;

    public RefundRequestService(
            RefundRequestRepository refundRequestRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            RefundReasonRepository refundReasonRepository,
            UserRepository userRepository
    ) {
        this.refundRequestRepository = refundRequestRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.refundReasonRepository = refundReasonRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefundRequestEntity createRefundRequest(Long userId, RefundRequestDTO dto) {
        // 1. Validate Order
        OrderEntity order = orderRepository.findById(dto.getOrderId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Optional: validate order belongs to user
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Order does not belong to user");
        }


        // 2. Create RefundRequestEntity
        RefundRequestEntity refundRequest = new RefundRequestEntity();
        refundRequest.setOrder(order);
        refundRequest.setUser(user);
        refundRequest.setStatus(RefundStatus.REQUESTED);
        refundRequest.setCreatedAt(LocalDateTime.now());
        refundRequest.setUpdatedAt(LocalDateTime.now());

        // Save refundRequest early so it gets an ID (required for FK in histories)
        refundRequest = refundRequestRepository.save(refundRequest);

        // Add initial status history for refund request
        RefundStatusHistoryEntity requestStatusHistory = new RefundStatusHistoryEntity();
        requestStatusHistory.setRefundRequest(refundRequest);
        requestStatusHistory.setStatus(RefundStatus.REQUESTED);
        requestStatusHistory.setNote("Refund request created by customer");
        requestStatusHistory.setCreatedAt(LocalDateTime.now());
        // updatedBy can be null since this is customer-initiated
        refundStatusHistoryRepository.save(requestStatusHistory);

        // 3. Process Refund Items
        List<RefundItemEntity> refundItems = new ArrayList<>();
        for (RefundRequestDTO.RefundItemDTO itemDTO : dto.getItems()) {
            // Validate order item exists
            OrderItemEntity orderItem = orderItemRepository.findById(itemDTO.getOrderItemId())
                    .orElseThrow(() -> new RuntimeException("Order item not found"));

            if (!orderItem.getOrder().getId().equals(order.getId())) {
                throw new RuntimeException("Order item does not belong to order");
            }

            RefundReasonEntity reason = null;
            if (itemDTO.getReasonId() != null) {
                Long reasonIdLong = null;
                try {
                    reasonIdLong = Long.valueOf(itemDTO.getReasonId());
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Invalid reasonId format");
                }
                reason = refundReasonRepository.findById(reasonIdLong)
                        .orElseThrow(() -> new RuntimeException("Refund reason not found"));
            }

            RefundItemEntity refundItem = new RefundItemEntity();
            refundItem.setRefundRequest(refundRequest);
            refundItem.setOrderItem(orderItem);
            refundItem.setQuantity(itemDTO.getQuantity());
            refundItem.setReason(reason);
            refundItem.setCustomerNote(itemDTO.getCustomReasonText());
            refundItem.setStatus(RefundItemStatus.REQUESTED);
            refundItem.setRequestedAction(itemDTO.getRequestedAction());

            // Add images linked to refundItem
            if (itemDTO.getProofImageUrls() != null && !itemDTO.getProofImageUrls().isEmpty()) {
                List<RefundItemImageEntity> images = new ArrayList<>();
                for (String url : itemDTO.getProofImageUrls()) {
                    RefundItemImageEntity image = new RefundItemImageEntity();
                    image.setRefundItem(refundItem);
                    image.setImgPath(url);
                    images.add(image);
                }
                refundItem.setImages(new HashSet<>(images));
            }

            refundItem = refundItemRepository.save(refundItem);  // save to get ID

            // Add initial status history for refund item
            RefundItemStatusHistoryEntity itemStatusHistory = new RefundItemStatusHistoryEntity();
            itemStatusHistory.setRefundItem(refundItem);
            itemStatusHistory.setStatus(RefundItemStatus.REQUESTED);
            itemStatusHistory.setNote("Refund item created by customer");
            itemStatusHistory.setCreatedAt(LocalDateTime.now());
            // updatedBy null for customer action
            refundItemStatusHistoryRepository.save(itemStatusHistory);

            refundItems.add(refundItem);
        }

        refundRequest.setItems(new HashSet<>(refundItems));
        refundRequest = refundRequestRepository.save(refundRequest);
        notificationService.notifyRefundRequested(order.getId(), user.getId(), user.getName());

        return refundRequest;

    }

    public List<RefundRequestAdminDTO> getAllForAdmin() {
        List<RefundRequestEntity> entities = refundRequestRepository.findAll();

        return entities.stream().map(this::mapToDTO).toList();
    }

    public RefundRequestAdminDTO mapToDTO(RefundRequestEntity entity) {
        RefundRequestAdminDTO dto = new RefundRequestAdminDTO();
        dto.setId(entity.getId());
        dto.setOrderId(entity.getOrder().getId());
        dto.setOrderDetail(orderService.convertToOrderDetailDto(entity.getOrder()));
        dto.setUserId(entity.getUser().getId());
        dto.setStatus(entity.getStatus());
        dto.setReturnTrackingCode(entity.getReturnTrackingCode());
        dto.setReceivedDate(entity.getReceivedDate());
        dto.setRefundedDate(entity.getRefundedDate());
        // dto.setAdminComment(entity.getAdminComment());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        // Map status history
        List<RefundStatusHistoryDTO> historyDTOs = entity.getStatusHistoryList().stream()
                .map(history -> {
                    RefundStatusHistoryDTO h = new RefundStatusHistoryDTO();
                    h.setId(history.getId());
                    h.setStatus(history.getStatus());
                    h.setNote(history.getNote());
                    h.setCreatedAt(history.getCreatedAt());
                    h.setUpdatedBy(Optional.ofNullable(history.getUpdatedBy()).map(UserEntity::getId).orElse(null));
                    h.setUpdatedAdmin(Optional.ofNullable(history.getUpdatedBy()).map(UserEntity::getName).orElse(null));
                    h.setUpdatedAdminRole(Optional.ofNullable(history.getUpdatedBy())
                            .map(UserEntity::getRole)
                            .map(RoleEntity::getName)
                            .orElse(null));
                    return h;
                }).toList();
        dto.setStatusHistory(historyDTOs);

        List<RefundItemAdminDTO> itemDTOs = entity.getItems().stream().map(item -> {
            RefundItemAdminDTO i = new RefundItemAdminDTO();
            i.setId(item.getId());
            i.setOrderItemId(item.getOrderItem().getId());
            i.setQuantity(item.getQuantity());
            i.setReasonId(item.getReason() != null ? item.getReason().getId() : null);
            i.setRejectionReasonId(item.getRejectionReason() != null ? item.getRejectionReason().getId() : null);
            i.setAdminComment(item.getAdminComment());
            i.setCustomReasonText(item.getCustomerNote());
            i.setStatus(item.getStatus());
            i.setUpdatedAt(item.getUpdatedAt());
            i.setProductName(item.getOrderItem().getVariant().getProduct().getName());       // assuming getProduct() exists
            i.setSku(item.getOrderItem().getVariant().getSku());
            i.setRequestedAction(item.getRequestedAction());

            // Map refund item status history
            List<RefundItemStatusHistoryDTO> itemHistoryDTOs = item.getStatusHistoryList().stream()
                    .map(history -> {
                        RefundItemStatusHistoryDTO h = new RefundItemStatusHistoryDTO();
                        h.setId(history.getId());
                        h.setStatus(history.getStatus());
                        h.setNote(history.getNote());
                        h.setCreatedAt(history.getCreatedAt());
                        h.setUpdatedBy(Optional.ofNullable(history.getUpdatedBy()).map(UserEntity::getId).orElse(null));
                        h.setUpdatedAdmin(Optional.ofNullable(history.getUpdatedBy()).map(UserEntity::getName).orElse(null));
                        h.setUpdatedAdminRole(Optional.ofNullable(history.getUpdatedBy())
                                .map(UserEntity::getRole)
                                .map(RoleEntity::getName)
                                .orElse(null));
                        return h;
                    }).toList();
            i.setStatusHistory(itemHistoryDTOs);

            String variantImage = item.getOrderItem().getVariant() != null
                    ? item.getOrderItem().getVariant().getImgPath()
                    : null;

            if (variantImage != null && !variantImage.isEmpty()) {
                i.setProductImg(variantImage);
            } else {
                var productImages = item.getOrderItem().getVariant().getProduct().getProductImages();
                if (productImages != null && !productImages.isEmpty()) {
                    String mainImagePath = productImages.stream()
                            .filter(img -> Boolean.TRUE.equals(img.isMainImageStatus()))
                            .map(img -> img.getImgPath())
                            .findFirst()
                            .orElse(productImages.get(0).getImgPath()); // fallback to first if no main image
                    i.setProductImg(mainImagePath);
                } else {
                    i.setProductImg("/assets/images/product-placeholder.png");
                }
            }


            List<RefundItemImageDTO> imageDTOs = item.getImages().stream().map(img -> {
                RefundItemImageDTO imgDTO = new RefundItemImageDTO();
                imgDTO.setId(img.getId());
                imgDTO.setImgPath(img.getImgPath());
                imgDTO.setUploadedAt(img.getUploadedAt());
                return imgDTO;
            }).toList();

            i.setImages(imageDTOs);
            return i;
        }).toList();


        dto.setItems(itemDTOs);

        return dto;
    }

    public RefundRequestAdminDTO mapToSimpleDTO(RefundRequestEntity entity) {
        RefundRequestAdminDTO dto = new RefundRequestAdminDTO();
        dto.setId(entity.getId());
        dto.setOrderId(entity.getOrder().getId());
        dto.setUserId(entity.getUser().getId());
        dto.setStatus(entity.getStatus());
        dto.setReturnTrackingCode(entity.getReturnTrackingCode());
        dto.setReceivedDate(entity.getReceivedDate());
        dto.setRefundedDate(entity.getRefundedDate());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());

        List<RefundItemAdminDTO> itemDTOs = entity.getItems().stream().map(item -> {
            RefundItemAdminDTO i = new RefundItemAdminDTO();
            i.setId(item.getId());
            i.setOrderItemId(item.getOrderItem().getId());
            i.setQuantity(item.getQuantity());
            i.setStatus(item.getStatus());
            i.setRequestedAction(item.getRequestedAction());
            i.setRejectionReasonId(item.getRejectionReason() != null ? item.getRejectionReason().getId() : null);
            i.setAdminComment(item.getAdminComment());

            i.setProductName(item.getOrderItem().getVariant().getProduct().getName());
            i.setSku(item.getOrderItem().getVariant().getSku());

            String variantImage = item.getOrderItem().getVariant() != null
                    ? item.getOrderItem().getVariant().getImgPath()
                    : null;

            if (variantImage != null && !variantImage.isEmpty()) {
                i.setProductImg(variantImage);
            } else {
                var productImages = item.getOrderItem().getVariant().getProduct().getProductImages();
                if (productImages != null && !productImages.isEmpty()) {
                    String mainImagePath = productImages.stream()
                            .filter(img -> Boolean.TRUE.equals(img.isMainImageStatus()))
                            .map(img -> img.getImgPath())
                            .findFirst()
                            .orElse(productImages.get(0).getImgPath());
                    i.setProductImg(mainImagePath);
                } else {
                    i.setProductImg("/assets/images/product-placeholder.png");
                }
            }

            return i;
        }).toList();

        dto.setItems(itemDTOs);
        return dto;
    }


    public RefundRequestAdminDTO getRefundRequestDetail(Long id) {
        RefundRequestEntity entity = refundRequestRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Refund request not found"));
        return mapToDTO(entity);
    }

    public List<RefundRequestAdminDTO> getRefundsForOrderDetailPage(Long orderId) {
        return refundRequestRepository.findByOrderIdWithAllDetails(orderId).stream()
                .map(this::mapToSimpleDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void reviewRefundItems(Long adminId, RefundRequestDTO.ReviewBatchRequestDTO request) {
        // Load refund request
        RefundRequestEntity refundRequest = refundRequestRepository.findById(request.getRefundRequestId())
                .orElseThrow(() -> new RuntimeException("Refund request not found"));

        // Load admin user
        UserEntity admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Process each item decision
        for (RefundRequestDTO.ReviewItemDecisionDTO decision : request.getItemDecisions()) {
            RefundItemEntity item = refundItemRepository.findById(decision.getItemId())
                    .orElseThrow(() -> new RuntimeException("Refund item not found"));

            if (!item.getRefundRequest().getId().equals(refundRequest.getId())) {
                throw new RuntimeException("Refund item does not belong to this request");
            }

            // Update item status based on admin decision
            if ("approve".equalsIgnoreCase(decision.getAction())) {
                if (item.getRequestedAction() == RequestedRefundAction.REFUND_ONLY) {
                    item.setStatus(RefundItemStatus.APPROVED);
                } else {
                    item.setStatus(RefundItemStatus.RETURN_PENDING);

                    if (item.getRequestedAction() == RequestedRefundAction.REPLACEMENT) {
                        ProductVariantEntity variant = item.getOrderItem().getVariant();
                        int requestedQty = item.getOrderItem().getQuantity();

                        // ✅ Check stock
                        if (variant.getStock() < requestedQty) {
                            throw new RuntimeException("Not enough stock for variant: " + variant.getId());
                        }

                        // 🟢 Proceed with replacement order creation
                        OrderEntity replacementOrder = new OrderEntity();
                        replacementOrder.setUser(refundRequest.getUser());
                        replacementOrder.setUserAddress(refundRequest.getOrder().getUserAddress());
                        replacementOrder.setOrderType(OrderType.REPLACEMENT);
                        replacementOrder.setTrackingNumber("TRK" + System.currentTimeMillis() + (int) (Math.random() * 1000));
                        replacementOrder.setPaymentStatus(PaymentStatus.PAID);
                        replacementOrder.setTotalAmount(0);
                        replacementOrder.setShippingFee(0);
                        replacementOrder.setCreatedDate(LocalDateTime.now());
                        replacementOrder.setDeliveryMethod(refundRequest.getOrder().getDeliveryMethod());

                        // Initial status: ORDER_PENDING
                        OrderStatusTypeEntity initialStatus = orderStatusTypeRepository.findByCode("ORDER_PENDING")
                                .orElseThrow(() -> new RuntimeException("Initial order status not found"));
                        replacementOrder.setCurrentStatus(initialStatus);

                        // Add status history
                        OrderStatusHistoryEntity replacementHistory = new OrderStatusHistoryEntity();
                        replacementHistory.setOrder(replacementOrder);
                        replacementHistory.setStatus(initialStatus);
                        replacementHistory.setCreatedAt(LocalDateTime.now());
                        replacementHistory.setNote("Replacement order created due to approved refund request.");
                        replacementHistory.setUpdatedBy(adminId);
                        replacementOrder.setStatusHistoryList(List.of(replacementHistory));

                        // Add the replacement item
                        OrderItemEntity replacementItem = new OrderItemEntity();
                        replacementItem.setOrder(replacementOrder);
                        replacementItem.setVariant(item.getOrderItem().getVariant()); // You must link original order item to refund item first
                        replacementItem.setQuantity(item.getOrderItem().getQuantity()); // Or allow editing?
                        replacementItem.setPrice(BigDecimal.ZERO); // Free replacement
                        replacementOrder.setItems(List.of(replacementItem));

                        orderRepository.save(replacementOrder);
                        item.setReplacementOrder(replacementOrder);

                        // Reserve the stock
                        variant.setStock(variant.getStock() - requestedQty);
                        variantRepository.save(variant);
                    }
                }
            } else if ("reject".equalsIgnoreCase(decision.getAction())) {
                item.setStatus(RefundItemStatus.REJECTED);
                if (decision.getRejectionReasonId() != null) {
                    RejectionReasonEntity rejectReason = rejectionReasonRepository.findById(decision.getRejectionReasonId())
                            .orElseThrow(() -> new RuntimeException("Reason not found"));
                    item.setRejectionReason(rejectReason);
                }
                item.setAdminComment(decision.getComment());
            }

            item.setUpdatedAt(LocalDateTime.now());
            refundItemRepository.save(item);

            // Add status history for this item
            RefundItemStatusHistoryEntity history = new RefundItemStatusHistoryEntity();
            history.setRefundItem(item);
            history.setStatus(item.getStatus());
            history.setCreatedAt(LocalDateTime.now());
            history.setNote("Admin reviewed item");
            history.setUpdatedBy(admin);
            refundItemStatusHistoryRepository.save(history);
        }

        // Reload updated refund request with latest items
        refundRequest = refundRequestRepository.findByIdWithItems(refundRequest.getId())
                .orElseThrow(() -> new RuntimeException("Refund request not found after updating items"));
        Set<RefundItemEntity> allItems = refundRequest.getItems();

        if (allItems == null || allItems.isEmpty()) {
            throw new RuntimeException("No refund items found for this request");
        }

        // Determine new status
        boolean allRejected = allItems.stream().allMatch(item -> item.getStatus() == RefundItemStatus.REJECTED);
        boolean allFinalized = allItems.stream().allMatch(item ->
                item.getStatus() == RefundItemStatus.REJECTED ||
                        item.getStatus() == RefundItemStatus.REFUNDED ||
                        item.getStatus() == RefundItemStatus.REPLACED ||
                        item.getStatus() == RefundItemStatus.RETURN_REJECTED
        );

        RefundStatus newStatus = allRejected
                ? RefundStatus.REJECTED
                : allFinalized
                ? RefundStatus.COMPLETED
                : RefundStatus.IN_PROGRESS;

        RefundStatus oldStatus = refundRequest.getStatus();

        // Only update and notify if status changed
        if (oldStatus != newStatus) {
            refundRequest.setStatus(newStatus);
            refundRequest.setUpdatedAt(LocalDateTime.now());
            refundRequestRepository.save(refundRequest);

            // Save status history
            RefundStatusHistoryEntity statusHistory = new RefundStatusHistoryEntity();
            statusHistory.setRefundRequest(refundRequest);
            statusHistory.setStatus(newStatus);
            statusHistory.setNote("Admin updated request status after item decisions");
            statusHistory.setCreatedAt(LocalDateTime.now());
            statusHistory.setUpdatedBy(admin);
            refundStatusHistoryRepository.save(statusHistory);

            // Send notification based on new status
            String type = switch (newStatus) {
                case COMPLETED -> "REFUND_COMPLETED";
                case REJECTED -> "REFUND_REJECTED";
                case IN_PROGRESS -> "REFUND_IN_PROGRESS";
                default -> null;
            };

            if (type != null) {
                Long orderId = refundRequest.getOrder().getId();
                Long customerId = refundRequest.getUser().getId();
                String customerName = refundRequest.getUser().getName();

                Map<String, Object> metadata = Map.of(
                        "orderId", orderId,
                        "customerId", customerId,
                        "customerName", customerName,
                        "orderIdLink", "/customer/orderDetail/" + orderId,
                        "customerIdLink", "/admin/customers/" + customerId
                );

                notificationService.notify(type, metadata, List.of(customerId));
            }
        }
    }

    @Transactional
    public void updateItemStatus(RefundRequestDTO.StatusUpdateRequest request) {
        RefundItemEntity item = refundItemRepository.findById(request.getItemId())
                .orElseThrow(() -> new IllegalArgumentException("Refund item not found"));

        RefundItemStatus currentStatus = item.getStatus();
        RefundItemStatus newStatus = request.getNewStatus();
        RequestedRefundAction action = item.getRequestedAction();

        if (currentStatus == newStatus) {
            return;
        }

        if (!isValidTransition(currentStatus, newStatus, action)) {
            throw new IllegalArgumentException("Invalid status transition from " + currentStatus + " to " + newStatus + " for action: " + action);
        }

        // 🛠️ Handle rejection-specific fields
        if (newStatus == RefundItemStatus.REJECTED || newStatus == RefundItemStatus.RETURN_REJECTED) {
            if (request.getRejectionReasonId() == null) {
                throw new IllegalArgumentException("Rejection reason is required for rejection status.");
            }

            RejectionReasonEntity rejectionReason = rejectionReasonRepository.findById(request.getRejectionReasonId())
                    .orElseThrow(() -> new IllegalArgumentException("Rejection reason not found"));
            item.setRejectionReason(rejectionReason);

            if (request.getRejectionComment() != null && !request.getRejectionComment().isBlank()) {
                item.setAdminComment(request.getRejectionComment());
            }
        } else {
            // For non-rejection updates, allow optional note
            if (request.getNote() != null && !request.getNote().isBlank()) {
                item.setAdminComment(request.getNote());
            }
        }

        item.setStatus(newStatus);
        item.setUpdatedAt(LocalDateTime.now());
        refundItemRepository.save(item);

        // Update replacement order status if linked
        OrderEntity replacementOrder = item.getReplacementOrder();
        if (replacementOrder != null) {
            OrderStatusTypeEntity newOrderStatus = null;

            if (newStatus == RefundItemStatus.RETURN_REJECTED) {
                newOrderStatus = orderStatusTypeRepository.findByCode("ORDER_CANCELLED")
                        .orElseThrow(() -> new RuntimeException("ORDER_CANCELLED status not found"));
            } else if (newStatus == RefundItemStatus.RETURN_PENDING) {
                newOrderStatus = orderStatusTypeRepository.findByCode("ORDER_PENDING")
                        .orElseThrow(() -> new RuntimeException("ORDER_PENDING status not found"));
            }

            if (newOrderStatus != null && !newOrderStatus.equals(replacementOrder.getCurrentStatus())) {
                replacementOrder.setCurrentStatus(newOrderStatus);
                replacementOrder.setUpdatedDate(LocalDateTime.now());
                orderRepository.save(replacementOrder);

                // Save order status history
                OrderStatusHistoryEntity orderStatusHistory = new OrderStatusHistoryEntity();
                orderStatusHistory.setOrder(replacementOrder);
                orderStatusHistory.setStatus(newOrderStatus);
                orderStatusHistory.setCreatedAt(LocalDateTime.now());
                orderStatusHistory.setUpdatedBy(request.getAdminId());
                orderStatusHistory.setNote("Updated due to refund item status change to: " + newStatus.name());
                orderStatusHistoryRepository.save(orderStatusHistory);

                // 🔁 Roll back stock if replacement is cancelled
                if ("ORDER_CANCELLED".equalsIgnoreCase(newOrderStatus.getCode())) {
                    for (OrderItemEntity replacementItem : replacementOrder.getItems()) {
                        ProductVariantEntity variant = replacementItem.getVariant();
                        if (variant != null) {
                            variant.setStock(variant.getStock() + replacementItem.getQuantity());
                            variantRepository.save(variant);
                        }
                    }
                }
            }
        }

        UserEntity adminUser = userRepository.findById(request.getAdminId())
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        // Save status history
        RefundItemStatusHistoryEntity history = new RefundItemStatusHistoryEntity();
        history.setRefundItem(item);
        history.setStatus(newStatus);
        history.setCreatedAt(LocalDateTime.now());
        history.setNote("Admin updated status");
        history.setUpdatedBy(adminUser);
        refundItemStatusHistoryRepository.save(history);

        // Now check if all items have reached final state
        RefundRequestEntity refundRequest = item.getRefundRequest();
        Set<RefundItemEntity> allItems = refundRequest.getItems();

        RefundStatus oldStatus = refundRequest.getStatus();

        boolean allFinalized = allItems.stream().allMatch(i ->
                i.getStatus() == RefundItemStatus.REJECTED ||
                        i.getStatus() == RefundItemStatus.REFUNDED ||
                        i.getStatus() == RefundItemStatus.REPLACED ||
                        i.getStatus() == RefundItemStatus.RETURN_REJECTED
        );

        RefundStatus newRequestStatus;
        if (allFinalized) {
            newRequestStatus = RefundStatus.COMPLETED;
        } else {
            newRequestStatus = RefundStatus.IN_PROGRESS;
        }

        if (oldStatus != newRequestStatus) {
            refundRequest.setStatus(newRequestStatus);
            refundRequest.setUpdatedAt(LocalDateTime.now());
            refundRequestRepository.save(refundRequest);

            // Save refund request status history only if status changed
            RefundStatusHistoryEntity statusHistory = new RefundStatusHistoryEntity();
            statusHistory.setRefundRequest(refundRequest);
            statusHistory.setStatus(newRequestStatus);
            statusHistory.setCreatedAt(LocalDateTime.now());
            statusHistory.setNote("Refund request status updated automatically");
            statusHistory.setUpdatedBy(adminUser);
            refundStatusHistoryRepository.save(statusHistory);
        } else {
            // Optional: update updatedAt if you want, or skip save entirely
            refundRequest.setUpdatedAt(LocalDateTime.now());
            refundRequestRepository.save(refundRequest);
        }

        String notificationType = switch (newStatus) {
            // case REQUESTED -> "REFUND_REQUESTED";
            case APPROVED -> "REFUND_APPROVED";
            case RETURN_PENDING -> "RETURN_PENDING";
            case RETURN_RECEIVED -> "RETURN_ITEM_RECEIVED";
            case REJECTED, RETURN_REJECTED -> "REFUND_REJECTED";
            case REFUNDED -> "REFUND_COMPLETED";
            case REPLACED -> "REFUND_REPLACED";
            //case REJECTED -> "REFUND_REJECTED";
            default -> null;
        };


        if (notificationType != null) {
            Long orderId = refundRequest.getOrder().getId();
            Long userId = refundRequest.getUser().getId();

            notificationService.notify(
                    notificationType,
                    Map.of(
                            "orderId", orderId,
                            "orderIdLink", "/customer/orderDetail/" + orderId
                    ),
                    List.of(userId)
            );
        }

    }

    private boolean isValidTransition(RefundItemStatus current, RefundItemStatus next, RequestedRefundAction action) {
        // No transition if same status
        if (current == next) return false;

        // Final states cannot transition
        if (current == RefundItemStatus.REJECTED || current == RefundItemStatus.REFUNDED ||
                current == RefundItemStatus.REPLACED || current == RefundItemStatus.RETURN_REJECTED) {
            return false;
        }

        return switch (action) {
            case REFUND_ONLY -> switch (current) {
                case REQUESTED -> next == RefundItemStatus.APPROVED || next == RefundItemStatus.REJECTED;
                case APPROVED -> next == RefundItemStatus.REFUNDED;
                default -> false;
            };
            case RETURN_AND_REFUND -> switch (current) {
                case REQUESTED -> next == RefundItemStatus.APPROVED || next == RefundItemStatus.REJECTED;
                case APPROVED -> next == RefundItemStatus.RETURN_PENDING;
                case RETURN_PENDING ->
                        next == RefundItemStatus.RETURN_RECEIVED || next == RefundItemStatus.RETURN_REJECTED; // allow direct rejection
                case RETURN_RECEIVED -> next == RefundItemStatus.REFUNDED || next == RefundItemStatus.RETURN_REJECTED;
                default -> false;
            };
            case REPLACEMENT -> switch (current) {
                case REQUESTED -> next == RefundItemStatus.APPROVED || next == RefundItemStatus.REJECTED;
                case APPROVED -> next == RefundItemStatus.RETURN_PENDING;
                case RETURN_PENDING ->
                        next == RefundItemStatus.RETURN_RECEIVED || next == RefundItemStatus.RETURN_REJECTED; // allow direct rejection
                case RETURN_RECEIVED -> next == RefundItemStatus.REPLACED || next == RefundItemStatus.RETURN_REJECTED;
                default -> false;
            };
        };
    }

//    public int getAlreadyReturnedOrProcessingQty(Long orderItemId) {
//        List<RefundItemStatus> excluded = List.of(
//                RefundItemStatus.REJECTED,
//                RefundItemStatus.RETURN_REJECTED
//        );
//        return refundItemRepository.sumReturnedQuantityByOrderItemId(orderItemId, excluded);
//    }

}
