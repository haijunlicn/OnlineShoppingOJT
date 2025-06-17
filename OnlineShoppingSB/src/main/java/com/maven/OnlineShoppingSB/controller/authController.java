package com.maven.OnlineShoppingSB.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.maven.OnlineShoppingSB.dto.userDTO;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.service.CustomUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.OnlineShoppingSB.config.JwtService;
import com.maven.OnlineShoppingSB.dto.LoginRequest;
import com.maven.OnlineShoppingSB.dto.ResetPasswordRequest;
import com.maven.OnlineShoppingSB.dto.otpDTO;
import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import com.maven.OnlineShoppingSB.service.AuthService;
import com.maven.OnlineShoppingSB.service.EmailService;


import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;


@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/auth")
public class authController {

    @Autowired
    private AuthService userService;
    @Autowired
    private UserRepository userRepo;
    @Autowired
    private OtpRepository otpRepo;
    @Autowired
    private EmailService emailService;
    @Autowired
    private AuthenticationManager authManager;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private CustomUserDetailsService customUserDetailsService;
    private PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();


    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody UserEntity user) {
        String result = userService.registerUser(user);

        Map<String, Object> response = new HashMap<>();

        if (result.startsWith("Email sent successfully. User ID: ")) {
            String id = result.substring("Email sent successfully. User ID: ".length()).trim();
            response.put("message", "Email sent successfully.");
            response.put("userId", id);
            return ResponseEntity.ok(response);

        } else if ("email already exists".equals(result)) {
            response.put("message", "Email already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);

        } else {

            response.put("message", "Something went wrong! Try again");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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

        Optional<OtpEntity> otpOpt = otpRepo.findTopByUserIdAndOtpCodeOrderByCreatedDateDesc(
                request.getUserId(),           // userId from frontend
                request.getOtpCode()       // OTP code entered by user
        );
        if (otpOpt.isPresent()) {
            OtpEntity otpEntity = otpOpt.get();

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
        String newOtp = String.format("%06d", (int) (Math.random() * 1_000_000));

        OtpEntity otp = new OtpEntity();
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

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("[DEBUG] Received login request: " + loginRequest);

            Integer requestedRoleType = loginRequest.getRoleType();
            System.out.println("[DEBUG] Requested roleType: " + requestedRoleType);
            if (requestedRoleType == null) {
                System.out.println("[DEBUG] Role type is null - returning BAD_REQUEST");
                return ResponseEntity.badRequest().body(Map.of("message", "Role type must be provided."));
            }

            Optional<UserEntity> optionalUser = userRepo.findByEmailAndRoleType(loginRequest.getEmail(), requestedRoleType);
            System.out.println("[DEBUG] User lookup by email and roleType done");

            if (optionalUser.isEmpty()) {
                System.out.println("[DEBUG] User not found with email and roleType - returning NOT_FOUND");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "User not found with this email and role type."));
            }

            System.out.println("looked up user : " + optionalUser);

            UserEntity user = optionalUser.get();
            System.out.println("[DEBUG] Found user: " + user);

            if (Boolean.FALSE.equals(user.getIsVerified())) {
                System.out.println("[DEBUG] User email not verified - returning UNAUTHORIZED");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Email is not verified.", "id", user.getId()));
            }

            System.out.println("[DEBUG] Authenticating user");
//            Authentication auth = authManager.authenticate(
//                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
//            );

            UserDetails userDetails = customUserDetailsService.loadUserByUsernameAndRoleType(
                    loginRequest.getEmail(),
                    loginRequest.getRoleType()
            );

            if (!passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword())) {
                throw new BadCredentialsException("Invalid credentials");
            }

            Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, loginRequest.getPassword(), userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);


            System.out.println("[DEBUG] Authentication successful");

            SecurityContextHolder.getContext().setAuthentication(auth);
            System.out.println("[DEBUG] SecurityContext updated with authentication");

            String token = jwtService.generateTokenWithUserDetails(user);
            System.out.println("[DEBUG] JWT token generated");

            return ResponseEntity.ok(Map.of("token", token));

        } catch (BadCredentialsException e) {
            System.out.println("[DEBUG] BadCredentialsException caught: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials."));
        } catch (Exception e) {
            System.out.println("[DEBUG] Exception caught: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An error occurred: " + e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestParam String email, @RequestParam Integer roleType) {
        UserEntity user = userRepo.findByEmailAndRoleType(email, roleType)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        userDTO userDTO = new userDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setName(user.getName());
        userDTO.setPhone(user.getPhone());
        userDTO.setIsVerified(user.getIsVerified());
        userDTO.setDelFg(user.getDelFg());
        userDTO.setCreatedDate(user.getCreatedDate());
        userDTO.setUpdatedDate(user.getUpdatedDate());
        userDTO.setRoleName(user.getRole() != null ? user.getRole().getName() : null);

        return ResponseEntity.ok(userDTO);
    }


//    @GetMapping("/me")
//    public ResponseEntity<?> getCurrentUser(@RequestParam String email) {
//        UserEntity user = userRepo.findByEmail(email)
//                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
//
//        // 👉 Manual mapping to DTO
//        userDTO userDTO = new userDTO();
//        userDTO.setId(user.getId());
//        userDTO.setEmail(user.getEmail());
//        userDTO.setName(user.getName());
//        userDTO.setPhone(user.getPhone());
//        userDTO.setIsVerified(user.getIsVerified());
//        userDTO.setDelFg(user.getDelFg());
//        userDTO.setCreatedDate(user.getCreatedDate());
//        userDTO.setUpdatedDate(user.getUpdatedDate());
//        userDTO.setRoleName(user.getRole() != null ? user.getRole().getName() : null); // Null check for role
//        return ResponseEntity.ok(userDTO);
//    }


    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody Map<String, String> body) {
        System.out.println("I'm forget Password");
        String email = body.get("email");
        userService.sendResetLink(email);
        return ResponseEntity.ok("Reset link sent.");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest req) {
        userService.resetPassword(req.getToken(), req.getPassword());
        return ResponseEntity.ok("Password reset successful.");
    }


}