package com.maven.OnlineShoppingSB.controller;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.OnlineShoppingSB.dto.otpDTO;
import com.maven.OnlineShoppingSB.entity.Otp;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.service.AuthService;
import com.maven.OnlineShoppingSB.service.EmailService;



@CrossOrigin(origins="http://localhost:4200")
@RestController
@RequestMapping("/auth")
public class authController {

    @Autowired private AuthService userService;

    @Autowired private UserRepository userRepo;
    @Autowired private OtpRepository otpRepo;
    @Autowired private EmailService emailService;
    
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserEntity user) {
    	String result = userService.registerUser(user);

        if (result.startsWith("email sending success")) {
            String id = result.substring("email sending success".length());
            
            return ResponseEntity.ok("Email sent successfully. User ID: " + id);
        } else if ("email already exists".equals(result)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("email already exists");
            }
        	
        	else {
        		System.out.println(result);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody otpDTO request) {
        // Find user by userId from request DTO
    		System.out.println(request.getUserId());
    		System.out.println(request.getOtpCode());
    		System.out.println(request.getPurpose());
    		System.out.println(request.getId());
    		
        Optional<UserEntity> userOpt = userRepo.findById(request.getUserId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("message", "Invalid user."));
        }
        
        UserEntity user = userOpt.get();

        Optional<Otp> otpOpt = otpRepo.findTopByUserIdAndOtpCodeOrderByCreatedDateDesc(
        	    request.getUserId(),           // userId from frontend
        	    request.getOtpCode()       // OTP code entered by user
        	);
        if (otpOpt.isPresent()) {
            Otp otpEntity = otpOpt.get();

            // Step 1: Check if OTP code matches and not used yet
            if (!otpEntity.getOtpCode().equals(request.getOtpCode()) || otpEntity.getIsUsed()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Invalid OTP code. Please try again."));
            }

            // Step 2: Check expiry time (within 2 minutes)
            LocalDateTime now = LocalDateTime.now();
            if (otpEntity.getExpiryTime().isBefore(now)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "OTP expired. Please request a new one."));
            }

            // Step 3: Mark OTP as used and user as verified
            otpEntity.setIsUsed(true);
            otpEntity.setPurpose(request.getPurpose());
            System.out.println("purpose test : " + request.getPurpose()); // it was null before
            otpRepo.save(otpEntity);
           
            user.setIsVerified(true);
            userRepo.save(user);

            return ResponseEntity.ok(Map.of("message", "Welcome " + user.getName()));
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("message", "Invalid otp varification"));
    }
    
    @GetMapping("/resend")
    public ResponseEntity<?> resendOtp(@RequestParam("userId") Long userId) {
        Optional<UserEntity> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid user."));
        }

        UserEntity user = userOpt.get();

        // Generate random 6-digit OTP
        String newOtp = String.format("%06d", (int)(Math.random() * 1_000_000));

        Otp otp = new Otp();
        otp.setUser(user);
        otp.setOtpCode(newOtp);
        otp.setIsUsed(false);
        otp.setCreatedDate(LocalDateTime.now());
        otp.setExpiryTime(LocalDateTime.now().plusMinutes(2));


        otpRepo.save(otp);

        boolean sent = emailService.sendOtpEmail(user.getEmail(), newOtp);
       
        if (sent) {
            return ResponseEntity.ok(Map.of(
                "message", "OTP resent to your email.",
                "userId", userId // return userId as separate field
            ));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Failed to send OTP email."));
        }
    } 




}