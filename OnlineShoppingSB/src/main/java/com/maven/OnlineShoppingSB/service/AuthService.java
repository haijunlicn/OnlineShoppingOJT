package com.maven.OnlineShoppingSB.service;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.entity.RoleEntity;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;

@Service
public class AuthService {

	 @Autowired private UserRepository userRepo;
	    @Autowired private RoleRepository roleRepo;
	    @Autowired private OtpRepository otpRepo;
	    @Autowired private EmailService emailService;
	    @Autowired private JavaMailSender mailSender;
	    private final Map<String, String> resetTokens = new HashMap<>(); // use Redis or DB in real app
	    @Autowired private PasswordEncoder passwordEncoder;
	    
	    public String registerUser(UserEntity userInput) {
	        // 1. Check duplicate email
	        if (userRepo.existsByEmail(userInput.getEmail())) {
	            return "email already exists";
	        } else {

	        // 2. Get "customer" role
	        RoleEntity customerRole = roleRepo.findByName("customer")
	            .orElseThrow(() -> new RuntimeException("Role not found"));

	        // 3. Set role & defaults
	        userInput.setName(userInput.getName());
	        userInput.setEmail( userInput.getEmail());
	        
	        String encryptedPassword = passwordEncoder.encode(userInput.getPassword());
	        userInput.setPassword(encryptedPassword);
	       
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
	        OtpEntity otp = new OtpEntity();
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
	    
	    public void sendResetLink(String email) {
	        try {
	            UserEntity user = userRepo.findByEmail(email)
	                .orElseThrow(() -> new RuntimeException("User not found"));

	            String token = UUID.randomUUID().toString();
	            resetTokens.put(token, email);

	            
	            String resetLink = "http://localhost:4200/customer/auth/reset-password?token=" + token;

	            // Send email (simplified)
	            SimpleMailMessage message = new SimpleMailMessage();
	            message.setTo(email);
	            message.setSubject("Password Reset");
	            message.setText("Click to reset your password: " + resetLink);
	            mailSender.send(message);
	            
	        } catch (RuntimeException e) {
	            // Handle user not found
	            System.err.println("Error finding user or generating token: " + e.getMessage());
	            throw new RuntimeException("Unable to process reset request: " + e.getMessage());
	            
	        } catch (Exception e) {
	            // Handle email sending failure or other errors
	            System.err.println("Error sending reset email: " + e.getMessage());
	            throw new RuntimeException("Failed to send reset email. Please try again later.");
	        }
	    }


	    public void resetPassword(String token, String newPassword) {
	        try {
	            String email = resetTokens.get(token);
	            if (email == null) {
	                throw new RuntimeException("Invalid or expired token");
	            }

	            UserEntity user = userRepo.findByEmail(email)
	                .orElseThrow(() -> new RuntimeException("User not found"));

	            user.setPassword(passwordEncoder.encode(newPassword));
	            userRepo.save(user);

	            // Remove the token after successful reset to prevent reuse
	            resetTokens.remove(token);

	        } catch (RuntimeException e) {
	            // Runtime exception: invalid token, user not found, etc.
	            System.err.println("Reset failed: " + e.getMessage());
	            throw new RuntimeException("Reset failed: " + e.getMessage());

	        } catch (Exception e) {
	            // Any unexpected exceptions (e.g. DB or encoding issues)
	            System.err.println("An unexpected error occurred during password reset: " + e.getMessage());
	            throw new RuntimeException("An unexpected error occurred. Please try again.");
	        }
	    }

	    
}
