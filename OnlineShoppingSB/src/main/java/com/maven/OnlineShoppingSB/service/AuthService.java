package com.maven.OnlineShoppingSB.service;


import java.time.LocalDateTime;
import java.util.Random;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.entity.Otp;
import com.maven.OnlineShoppingSB.entity.Role;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;

@Service
public class AuthService {

	 @Autowired private UserRepository userRepo;
	    @Autowired private RoleRepository roleRepo;
	    @Autowired private OtpRepository otpRepo;
	    @Autowired private EmailService emailService;

	    public String registerUser(UserEntity userInput) {
	        // 1. Check duplicate email
	        if (userRepo.existsByEmail(userInput.getEmail())) {
	            return "email already exists";
	        } else {

	        // 2. Get "customer" role
	        Role customerRole = roleRepo.findByName("customer")
	            .orElseThrow(() -> new RuntimeException("Role not found"));

	        // 3. Set role & defaults
	        userInput.setName(userInput.getName());
	        userInput.setEmail( userInput.getEmail());
	        userInput.setPassword(userInput.getPassword());
	        userInput.setRole(customerRole);
	        userInput.setIsVerified(false);
	        userInput.setDelFg(false);
	        userInput.setCreatedDate(LocalDateTime.now());
	        userInput.setUpdatedDate(LocalDateTime.now());

	        // 4. Save user to get id
	        UserEntity savedUser = userRepo.save(userInput);
	        Long userId = savedUser.getId();

	        // 5. Generate OTP (6 digit numeric)
	        String otpCode = String.format("%06d", new Random().nextInt(999999));

	        LocalDateTime now = LocalDateTime.now();
	        LocalDateTime expiryTime = now.plusMinutes(2);

	        // 6. Save OTP entity
	        Otp otp = new Otp();
	        otp.setUser(savedUser);
	        otp.setOtpCode(otpCode);
			// otp.setPurpose("EMAIL_VERIFICATION");
	        otp.setIsUsed(false);
	        otp.setCreatedDate(now);
	        otp.setExpiryTime(expiryTime);
	        otpRepo.save(otp);

	        // 7. Send OTP email
	        boolean emailSent = emailService.sendOtpEmail(savedUser.getEmail(), otpCode);

	        if (emailSent) {
	            return "email sending success" + userId;
	        } else {
	        	System.out.println("email sending fail");
	            return "email sending fail";
	        }
	    }
	    }
	    
	    
}
