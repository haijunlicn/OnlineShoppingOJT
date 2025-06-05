package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.dto.OptionValueDTO;
import com.maven.OnlineShoppingSB.service.OptionValueService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/option-value")
public class OptionValueController {

    @Autowired
    private OptionValueService valueService;

    @PostMapping("/create")
    public ResponseEntity<String> createOptionValue(@RequestBody OptionValueDTO dto) {
        valueService.createOptionValue(dto);
        return ResponseEntity.ok("Option value created successfully!");
    }

    @GetMapping("/list/{optionId}")
    public ResponseEntity<List<OptionValueDTO>> getValuesByOption(@PathVariable Integer optionId) {
        return ResponseEntity.ok(valueService.getValuesByOptionId(optionId));
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<OptionValueDTO> getOptionValueById(@PathVariable Long id) {
        return ResponseEntity.ok(valueService.getOptionValueById(id));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<String> updateOptionValue(@RequestBody OptionValueDTO dto) {
        valueService.updateOptionValue(dto);
        return ResponseEntity.ok("Option value updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteOptionValue(@PathVariable Long id) {
        valueService.deleteOptionValue(id);
        return ResponseEntity.ok("Option value deleted successfully!");
    }
}
