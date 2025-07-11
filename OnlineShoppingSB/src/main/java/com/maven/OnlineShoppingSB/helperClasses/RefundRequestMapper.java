package com.maven.OnlineShoppingSB.helperClasses;

import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.RefundRequestEntity;
import com.maven.OnlineShoppingSB.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RefundRequestMapper {
    private final OrderService orderService;

    @Autowired
    public RefundRequestMapper(OrderService orderService) {
        this.orderService = orderService;
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
                    h.setUpdatedBy(history.getUpdatedBy());
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
                        h.setUpdatedBy(history.getUpdatedBy());
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

}
