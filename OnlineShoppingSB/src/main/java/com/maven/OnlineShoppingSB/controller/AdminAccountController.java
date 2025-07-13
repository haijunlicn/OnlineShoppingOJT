package com.maven.OnlineShoppingSB.controller;

import com.maven.OnlineShoppingSB.config.JwtService;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.entity.RoleEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.service.AdminAccountService;
import com.maven.OnlineShoppingSB.service.AuthService;
import com.maven.OnlineShoppingSB.service.CustomUserDetailsService;
import com.maven.OnlineShoppingSB.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/adminAccounts")
public class AdminAccountController {

    @Autowired
    private AdminAccountService adminAccountService;

    @PostMapping("/create")
    public ResponseEntity<?> createAdminAccount(@RequestBody userDTO dto) {
        try {
            adminAccountService.createAdminAccount(dto);
            return ResponseEntity.ok("Admin account created successfully");
        } catch (ResponseStatusException ex) {
            return ResponseEntity.status(ex.getStatusCode()).body(Map.of("message", ex.getReason()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Unexpected error: " + e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<List<userDTO>> getAllUsers() {
        return ResponseEntity.ok(adminAccountService.getAllUsers());
    }

}