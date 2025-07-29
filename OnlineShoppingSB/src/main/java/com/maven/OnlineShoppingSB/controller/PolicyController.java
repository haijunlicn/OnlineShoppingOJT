package com.maven.OnlineShoppingSB.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maven.OnlineShoppingSB.dto.PolicyDTO;
import com.maven.OnlineShoppingSB.service.PolicyService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/policy")
public class PolicyController {

	@Autowired
    private PolicyService policyService;

	@PostMapping("/create")
	public ResponseEntity<String> createPolicy(@RequestBody PolicyDTO dto) {
	    try {
	        policyService.createPolicy(dto);
	        return ResponseEntity.ok("Policy created successfully!");
	    } catch (Exception e) {
	        e.printStackTrace(); // or use logger
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                .body("Failed to create policy: " + e.getMessage());
	    }
	}



    @GetMapping("/list")
    @PreAuthorize("hasAuthority('POLICY_MANAGEMENT') or hasRole('SUPERADMIN')")
    public ResponseEntity<List<PolicyDTO>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @GetMapping("/getbyid/{id}")
    public ResponseEntity<PolicyDTO> getPolicyById(@PathVariable Integer id) {
        PolicyDTO dto = policyService.getPolicyById(id);
        return dto != null ? ResponseEntity.ok(dto) : ResponseEntity.notFound().build();
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<PolicyDTO> updatePolicy(@PathVariable Integer id, @RequestBody PolicyDTO dto) {
        PolicyDTO updated = policyService.updatePolicy(id, dto);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deletePolicy(@PathVariable Integer id) {
        policyService.deletePolicy(id);
        return ResponseEntity.ok("Policy deleted successfully!");
    }
    @GetMapping("/type/{type}")
    public ResponseEntity<List<PolicyDTO>> getPoliciesByType(@PathVariable String type) {
        List<PolicyDTO> policies = policyService.getPoliciesByType(type);
        return ResponseEntity.ok(policies);
    }

}