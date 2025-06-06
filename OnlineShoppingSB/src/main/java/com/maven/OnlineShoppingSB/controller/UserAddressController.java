package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.UserAddressDto;
import com.maven.OnlineShoppingSB.service.UserAddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/locations")

public class UserAddressController {

    @Autowired
    private UserAddressService userAddressService;

    @PostMapping("/save")
    public ResponseEntity<UserAddressDto> saveUserAddress(@RequestBody UserAddressDto dto) {
        UserAddressDto saved = userAddressService.saveUserAddress(dto);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserAddressDto>> getAllUserAddresses() {
        List<UserAddressDto> list = userAddressService.getAllUserAddresses();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAddressDto> getUserAddressById(@PathVariable Integer id) {
        UserAddressDto dto = userAddressService.getUserAddressById(id);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserAddress(@PathVariable Integer id) {
        userAddressService.deleteUserAddress(id);
        return ResponseEntity.noContent().build();
    }
}
