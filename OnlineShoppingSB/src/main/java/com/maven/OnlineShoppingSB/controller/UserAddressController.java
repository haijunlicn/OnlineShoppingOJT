package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.dto.UserAddressDto;
import com.maven.OnlineShoppingSB.dto.UserResponseDTO;
import com.maven.OnlineShoppingSB.dto.userDTO;
import com.maven.OnlineShoppingSB.service.CustomUserDetailsService;
import com.maven.OnlineShoppingSB.service.UserAddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/locations")

public class UserAddressController {

    @Autowired
    private UserAddressService userAddressService;

    @Autowired
    private CustomUserDetailsService cudservice;

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

    @GetMapping("/city-user-counts")
    public ResponseEntity<List<Map<String, Object>>> getUserCountsByCity() {
        List<Object[]> results = userAddressService.getUserCountsByCity();
        List<Map<String, Object>> response = new java.util.ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("city", row[0]);
            map.put("count", row[1]);
            response.add(map);
        }
        System.out.println("City user counts response: " + response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/township-user-counts")
    public ResponseEntity<List<Map<String, Object>>> getUserCountsByTownship(@RequestParam String city) {
        List<Object[]> results = userAddressService.getUserCountsByTownship(city);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("township", row[0]);
            map.put("count", row[1]);
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/township-user-counts-with-order")
    public ResponseEntity<List<Map<String, Object>>> getUserCountsByTownshipWithOrder(@RequestParam String city) {
        List<Object[]> results = userAddressService.getUserCountsByTownshipWithOrder(city);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("township", row[0]);
            map.put("count", row[1]);
            map.put("orderedCount", row[2]);
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/city-user-counts-filtered")
    public ResponseEntity<List<Map<String, Object>>> getUserCountsByCityWithOrderFilter(@RequestParam boolean orderedOnly) {
        List<Object[]> results = userAddressService.getUserCountsByCityWithOrderFilter(orderedOnly);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            map.put("city", row[0]);
            map.put("count", row[1]);
            response.add(map);
        }
        return ResponseEntity.ok(response);
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

    @GetMapping("/{email}/{roleType}")
    public ResponseEntity<UserResponseDTO> getProfile(
            @PathVariable String email,
            @PathVariable Integer roleType) {
        UserResponseDTO profile = cudservice.getProfile(email, roleType);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/update/{email}/{roleType}")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @PathVariable String email,
            @PathVariable Integer roleType,
            @RequestBody UserResponseDTO updatedProfile) {
        UserResponseDTO updated = cudservice.updateProfile(email, roleType, updatedProfile);
        return ResponseEntity.ok(updated);
    }


}
