package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.StockUpdateRequest;
import com.maven.OnlineShoppingSB.dto.StockUpdateResponse;
import com.maven.OnlineShoppingSB.service.VariantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/variants")
public class VariantController {

    @Autowired
    private VariantService variantService;

    @PutMapping("/reserve-stock")
    public ResponseEntity<List<StockUpdateResponse>> reserveStock(@RequestBody List<StockUpdateRequest> requests) {
        List<StockUpdateResponse> responses = new ArrayList<>();
        System.out.println("reserve stock : " + requests);
        for (StockUpdateRequest req : requests) {
            responses.add(variantService.reserveStock(req.getVariantId(), req.getQuantity()));
        }
        return ResponseEntity.ok(responses);
    }


    @PutMapping("/rollback-stock")
    public ResponseEntity<List<StockUpdateResponse>> rollbackStock(@RequestBody List<StockUpdateRequest> requests) {
        System.out.println("yyyyyy");
        System.out.println("rolled back stock : " + requests);
        List<StockUpdateResponse> responses = variantService.rollbackStock(requests); // fixed line
        return ResponseEntity.ok(responses);
    }


@PutMapping("/update-stock-bulk")
public ResponseEntity<List<StockUpdateResponse>> updateStockBulk(@RequestBody List<StockUpdateRequest> requests) {
    List<StockUpdateResponse> responses = new ArrayList<>();
    for (StockUpdateRequest req : requests) {
        responses.add(variantService.updateStock(req.getVariantId(), req.getQuantity()));
    }
    return ResponseEntity.ok(responses);
}

}
