package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.StockUpdateRequest;
import com.maven.OnlineShoppingSB.dto.StockUpdateResponse;
import com.maven.OnlineShoppingSB.entity.ProductVariantEntity;
import com.maven.OnlineShoppingSB.repository.ProductVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Service
public class VariantService {

    @Autowired
    private ProductVariantRepository variantRepo;

    private final Map<Long, Integer> reservedStockMap = new HashMap<>();

    public StockUpdateResponse reserveStock(Long variantId, int quantity) {
        ProductVariantEntity variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        StockUpdateResponse response = new StockUpdateResponse();

        // Check if enough stock
        if (variant.getStock() < quantity) {
            response.setSuccess(false);
            System.out.println("not enough stock");
            response.setMessage("Not enough stock");
            response.setUpdatedStock(variant.getStock());
            return response;
        }

        // Reserve: subtract stock, save, and track
        System.out.println("old stock : " + variant.getStock());
        System.out.println("reserve quantity : " + quantity);
        variant.setStock(variant.getStock() - quantity);
        System.out.println("new stock : " + variant.getStock());
        variantRepo.save(variant);

        reservedStockMap.put(variantId, quantity);

        response.setSuccess(true);
        response.setMessage("Stock reserved");
        response.setUpdatedStock(variant.getStock());
        return response;
    }



    public StockUpdateResponse rollbackStock(Long variantId, int quantity) {
        System.out.println("ooooo");
        ProductVariantEntity variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        StockUpdateResponse response = new StockUpdateResponse();

        Integer reservedQty = reservedStockMap.getOrDefault(variantId, 0);
        if (quantity == 0) {
            response.setSuccess(true);
            response.setMessage("No rollback needed");
            response.setUpdatedStock(variant.getStock());
            return response;
        }

        variant.setStock(variant.getStock() + quantity);
        variantRepo.save(variant);
        reservedStockMap.remove(variantId);
        System.out.println("ppppp");
        response.setSuccess(true);
        response.setMessage("Stock rolled back");
        response.setUpdatedStock(variant.getStock());
        return response;
    }

    // NEW: Bulk rollback for a list of requests
    public List<StockUpdateResponse> rollbackStock(List<StockUpdateRequest> requests) {
        List<StockUpdateResponse> responses = new ArrayList<>();
        for (StockUpdateRequest req : requests) {
            responses.add(rollbackStock(req.getVariantId(), req.getQuantity()));
        }
        return responses;
    }


    public void clearReservedStock(Long variantId) {
        reservedStockMap.remove(variantId);
    }

    public StockUpdateResponse updateStock(Long variantId, int quantityToSubtract) {
        ProductVariantEntity variant = variantRepo.findById(variantId)
                .orElseThrow(() -> new RuntimeException("Variant not found"));

        int currentStock = variant.getStock();

        if (currentStock < quantityToSubtract) {
            StockUpdateResponse response = new StockUpdateResponse();
            response.setSuccess(false);
            response.setMessage("Not enough stock");
            response.setUpdatedStock(currentStock);
            return response;
        }

        variant.setStock(currentStock - quantityToSubtract);
        variantRepo.save(variant);

        StockUpdateResponse response = new StockUpdateResponse();
        response.setSuccess(true);
        response.setMessage("Stock updated (subtracted)");
        response.setUpdatedStock(variant.getStock());
        return response;
    }
}