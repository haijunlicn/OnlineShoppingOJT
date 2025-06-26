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

//    @GetMapping("/{id}")
//    public ResponseEntity<UserAddressDto> getUserAddressById(@PathVariable Integer id) {
//        UserAddressDto dto = userAddressService.getUserAddressById(id);
//        if (dto == null) {
//            return ResponseEntity.notFound().build();
//        }
//        return ResponseEntity.ok(dto);
//    }
@GetMapping("/user-locations")
public ResponseEntity<List<UserAddressDto>> getUserLocations(@RequestParam Integer userId) {
        System.out.println("hello2");
    List<UserAddressDto> dtos = userAddressService.getUserAddressesByUserId(userId);
    return ResponseEntity.ok(dtos);
}



    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUserAddress(@PathVariable Integer id) {
        userAddressService.deleteUserAddress(id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}")
    public ResponseEntity<UserAddressDto> getAddressById(@PathVariable Integer id) {
        UserAddressDto dto = userAddressService.getUserAddressById(id);
        if (dto != null) {
            return ResponseEntity.ok(dto);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateAddress(@PathVariable Integer id, @RequestBody UserAddressDto dto) {
        System.out.println("hay yo !");
        try {
            userAddressService.updateUserAddress(id, dto);
            return ResponseEntity.ok("User address updated successfully.");
        } catch (RuntimeException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }
}
