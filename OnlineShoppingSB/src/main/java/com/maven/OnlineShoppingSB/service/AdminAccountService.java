package com.maven.OnlineShoppingSB.service;


import com.maven.OnlineShoppingSB.dto.userDTO;
import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.entity.RoleEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
public class AdminAccountService {

    @Autowired
    private UserRepository userRepo;

    @Autowired
    private RoleRepository roleRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void createAdminAccount(userDTO dto) {
        if (dto.getRoleId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role ID is required");
        }

        RoleEntity role = roleRepo.findById(dto.getRoleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role"));

        if (role.getType() != 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only admin-type roles (type 1) are allowed");
        }

        // NEW: Check email uniqueness globally (no matter role)
        boolean emailExists = userRepo.existsByEmail(dto.getEmail());
        if (emailExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use.");
        }

        UserEntity newUser = new UserEntity();
        newUser.setEmail(dto.getEmail());
        newUser.setName(dto.getName());
        newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
        newUser.setRole(role);
        newUser.setIsVerified(true);
        newUser.setDelFg(false);
        newUser.setCreatedDate(LocalDateTime.now());
        newUser.setUpdatedDate(LocalDateTime.now());

        userRepo.save(newUser);
    }


//    @Transactional
//    public void createAdminAccount(userDTO dto) {
//        if (dto.getRoleId() == null) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role ID is required");
//        }
//
//        RoleEntity role = roleRepo.findById(dto.getRoleId())
//                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role"));
//
//        if (role.getType() != 1) {
//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only admin-type roles (type 1) are allowed");
//        }
//
//        boolean existsSameType = userRepo.findByEmailAndRoleType(dto.getEmail(), role.getType()).isPresent();
//        if (existsSameType) {
//            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account already exists for this role type.");
//        }
//
//        UserEntity newUser = new UserEntity();
//        newUser.setEmail(dto.getEmail());
//        newUser.setName(dto.getName());
//        newUser.setPassword(passwordEncoder.encode(dto.getPassword()));
//        newUser.setRole(role);
//        newUser.setIsVerified(true);
//        newUser.setDelFg(false);
//        newUser.setCreatedDate(LocalDateTime.now());
//        newUser.setUpdatedDate(LocalDateTime.now());
//
//        userRepo.save(newUser);
//    }

}
