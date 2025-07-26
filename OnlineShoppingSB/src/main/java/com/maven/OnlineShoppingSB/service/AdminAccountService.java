package com.maven.OnlineShoppingSB.service;


import com.maven.OnlineShoppingSB.dto.userDTO;
import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.entity.PermissionEntity;
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
import java.util.*;
import java.util.stream.Collectors;

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

    public List<userDTO> getAllUsers() {
        return userRepo.findAll().stream().map(user -> {
            userDTO dto = new userDTO();
            dto.setId(user.getId());
            dto.setEmail(user.getEmail());
            dto.setName(user.getName());
//            dto.setPhone(user.getPhone());
            dto.setProfile(user.getProfile());
            dto.setProfile(user.getProfile());
            dto.setRoleName(user.getRole().getName());
            dto.setIsVerified(user.getIsVerified());
            dto.setDelFg(user.getDelFg());
            dto.setCreatedDate(user.getCreatedDate());
            dto.setUpdatedDate(user.getUpdatedDate());
            dto.setRoleId(user.getRole().getId());
            dto.setRoleName(user.getRole().getName());
            return dto;
        }).collect(Collectors.toList());
    }

    public List<userDTO> getAllCustomers() {
        return userRepo.findAll().stream()
                .filter(user -> user.getRole() != null && "Customer".equalsIgnoreCase(user.getRole().getName()))
                .map(user -> {
                    userDTO dto = new userDTO();
                    dto.setId(user.getId());
                    dto.setEmail(user.getEmail());
                    dto.setName(user.getName());
//                    dto.setPhone(user.getPhone());

                    dto.setProfile(user.getProfile());
                    dto.setRoleName(user.getRole().getName());
                    dto.setIsVerified(user.getIsVerified());
                    dto.setDelFg(user.getDelFg());
                    dto.setCreatedDate(user.getCreatedDate());
                    dto.setUpdatedDate(user.getUpdatedDate());
                    dto.setRoleId(user.getRole().getId());

                    // ✅ set groupIds from user.getCustomerGroups()
                    List<Long> groupIds = user.getCustomerGroup() != null
                            ? user.getCustomerGroup().stream()
                            .map(cg -> cg.getGroup().getId())
                            .collect(Collectors.toList())
                            : new ArrayList<>();
                    dto.setGroupIds(groupIds);

                    // Set city from latest address if available
                    if (user.getAddresses() != null && !user.getAddresses().isEmpty()) {
                        user.getAddresses().stream()
                            .filter(addr -> addr.getCity() != null)
                            .max(Comparator.comparing(addr -> addr.getCreatedDate() != null ? addr.getCreatedDate() : java.time.LocalDateTime.MIN))
                            .ifPresent(addr -> dto.setCity(addr.getCity()));
                    }

                    return dto;
                })
                .collect(Collectors.toList());
    }

}
