package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.DeliveryMethodDto;
import com.maven.OnlineShoppingSB.service.DeliveryMethodService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/delivery-methods")
public class DeliveryMethodController {
    @Autowired
    private DeliveryMethodService deliveryMethodService;

    @GetMapping("/available")
    public List<DeliveryMethodDto> getAvailableMethods(@RequestParam double distance) {
        return deliveryMethodService.getAvailableMethods(distance);
    }
}