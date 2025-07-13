package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> createOptionValue(@RequestBody OptionValueDTO dto) {
        valueService.createOptionValue(dto);
        return ResponseEntity.ok("Option value created successfully!");
    }

    @GetMapping("/list/{optionId}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<OptionValueDTO>> getValuesByOption(@PathVariable Integer optionId) {
        return ResponseEntity.ok(valueService.getValuesByOptionId(optionId));
    }

    @GetMapping("/getbyid/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<OptionValueDTO> getOptionValueById(@PathVariable Long id) {
        return ResponseEntity.ok(valueService.getOptionValueById(id));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<OptionValueDTO> update(@PathVariable Long id, @RequestBody OptionValueDTO dto) {
        OptionValueDTO updated = valueService.updateOptionValue(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> deleteOptionValue(@PathVariable Long id) {
        valueService.deleteOptionValue(id);
        return ResponseEntity.ok("Option value deleted successfully!");
    }

}
