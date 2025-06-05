package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.OptionDTO;
import com.maven.OnlineShoppingSB.service.OptionService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/option")
public class OptionController {

    @Autowired
    private OptionService optionService;

    @PostMapping("/create")
    public ResponseEntity<String> createOption(@RequestBody OptionDTO dto) {
        optionService.createOption(dto);
        return ResponseEntity.ok("Option created successfully!");
    }

    @GetMapping("/list")
    public ResponseEntity<List<OptionDTO>> getAllOptions() {
        List<OptionDTO> dtoList = optionService.getAllOptions();
        System.out.println("dto list ; " + dtoList);
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<OptionDTO> getOptionById(@PathVariable Long id) {
        return ResponseEntity.ok(optionService.getOptionById(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateOption(@RequestBody OptionDTO dto) {
        optionService.updateOption(dto);
        return ResponseEntity.ok("Option updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteOption(@PathVariable Long id) {
        optionService.deleteOption(id);
        return ResponseEntity.ok("Option deleted successfully!");
    }
}
