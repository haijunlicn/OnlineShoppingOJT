package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import com.maven.OnlineShoppingSB.dto.OptionValueDTO;
import com.maven.OnlineShoppingSB.service.OptionValueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> createOption(@RequestBody OptionDTO dto) {
        optionService.createOption(dto);
        return ResponseEntity.ok("Option created successfully!");
    }

    @GetMapping("/list")
    @PreAuthorize("hasAuthority('ATTRIBUTE_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<OptionDTO>> getAllOptions() {
        return ResponseEntity.ok(optionService.getAllOptions());
    }

    @GetMapping("/getbyid/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_READ') or hasRole('SUPERADMIN')")
    public ResponseEntity<OptionDTO> getOptionById(@PathVariable Long id) {
        return ResponseEntity.ok(optionService.getOptionById(id));
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> updateOption(@RequestBody OptionDTO dto) {
        optionService.updateOption(dto);
        return ResponseEntity.ok("Option updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAuthority('ATTRIBUTE_MANAGE') or hasRole('SUPERADMIN')")
    public ResponseEntity<String> deleteOption(@PathVariable Long id) {
        optionService.deleteOption(id);
        return ResponseEntity.ok("Option deleted successfully!");
    }

}
