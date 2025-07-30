package com.maven.OnlineShoppingSB.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.maven.OnlineShoppingSB.config.CustomUserDetails;
import com.maven.OnlineShoppingSB.dto.*;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.service.CustomUserDetailsService;
import com.maven.OnlineShoppingSB.service.EmailValidationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import com.maven.OnlineShoppingSB.config.JwtService;
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
    @Autowired
    private EmailValidationService emailValidationService;

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

        } else if ("Email already exists".equals(result)) {
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

            // Load user by email only
            UserDetails userDetails = customUserDetailsService.loadUserByUsername(loginRequest.getEmail());

            if (!(userDetails instanceof CustomUserDetails)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Invalid user details"));
            }

            UserEntity user = ((CustomUserDetails) userDetails).getUser();

            // Check roleType matches request
            if (!user.getRole().getType().equals(loginRequest.getRoleType())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "User role mismatch"));
            }

            if (Boolean.FALSE.equals(user.getIsVerified())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("message", "Email is not verified.", "id", user.getId()));
            }

            if (!passwordEncoder.matches(loginRequest.getPassword(), userDetails.getPassword())) {
                throw new BadCredentialsException("Invalid credentials");
            }

            // ✅ Update last login
            user.setLastLoginDate(LocalDateTime.now());
            userRepo.save(user);

            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);

            System.out.println("[DEBUG] Authentication successful");

            String token = jwtService.generateTokenWithUserDetails(user);
            System.out.println("[DEBUG] JWT token generated");

            return ResponseEntity.ok(Map.of("token", token));

        } catch (UsernameNotFoundException e) {
            System.out.println("[DEBUG] User not found: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User not found."));
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

    @Transactional(readOnly = true)
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("[DEBUG] Authentication in /me: " + auth);

        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() == "anonymousUser") {
            System.out.println("[DEBUG] User is not authenticated or principal is anonymousUser");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized");
        }

        Object principalObj = auth.getPrincipal();
        if (!(principalObj instanceof CustomUserDetails)) {
            System.out.println("[DEBUG] Principal is NOT an instance of CustomUserDetails but " + principalObj.getClass().getName());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized - invalid principal");
        }

        CustomUserDetails principal = (CustomUserDetails) principalObj;

        // Then build userDTO as before...

        UserEntity user = principal.getUser();
        if (user == null) {
            System.out.println("[DEBUG] user from principal is null");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Unauthorized - user missing");
        }

        System.out.println("[DEBUG] user entity: " + user);

        userDTO userDTO = new userDTO();
        try {
            userDTO.setId(user.getId());
            userDTO.setEmail(user.getEmail());
            userDTO.setName(user.getName());
            // userDTO.setPhone(user.getPhone());
            userDTO.setProfile(user.getProfile());
            userDTO.setIsVerified(user.getIsVerified());
            userDTO.setDelFg(user.getDelFg());
            userDTO.setCreatedDate(user.getCreatedDate());
            userDTO.setUpdatedDate(user.getUpdatedDate());
            userDTO.setRoleName(user.getRole() != null ? user.getRole().getName() : null);

            System.out.println("[DEBUG] userDTO basic fields set");

            if (user.getRole() != null && user.getRole().getPermissions() != null) {
                List<String> permissionNames = user.getRole().getPermissions()
                        .stream()
                        .map(p -> p.getCode())
                        .toList();
                userDTO.setPermissions(permissionNames);
                System.out.println("[DEBUG] permissions set: " + permissionNames);
            } else {
                System.out.println("[DEBUG] role or permissions null");
            }
        } catch (Exception e) {
            System.out.println("[ERROR] Exception building userDTO: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error preparing user data");
        }

        System.out.println("[DEBUG] returning userDTO: " + userDTO);
        return ResponseEntity.ok(userDTO);
    }

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

    @PutMapping("/update/{id}")
    public UserResponseDTO updateProfile(@PathVariable Long id, @RequestBody UserResponseDTO userDto) {
        return userService.updateProfile(id, userDto);
    }


    @PostMapping("/check-password")
    public ResponseEntity<?> checkCurrentPassword(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            String currentPassword = payload.get("currentPassword").toString();

            boolean isValid = userService.checkCurrentPassword(userId, currentPassword);
            return ResponseEntity.ok(isValid);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            String newPassword = payload.get("newPassword").toString();

            UserResponseDTO updatedUser = userService.changePassword(userId, newPassword);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/validateEmailWithAPI")
    public ResponseEntity<?> validateEmail(@RequestParam String email) {
        boolean isValid = emailValidationService.isValidEmail(email);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<userDTO> getUserById(@PathVariable Long userId) {
        try {
            Optional<UserEntity> userOpt = userRepo.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserEntity user = userOpt.get();
            userDTO userDTO = new userDTO();
            userDTO.setId(user.getId());
            userDTO.setEmail(user.getEmail());
            userDTO.setName(user.getName());
            userDTO.setProfile(user.getProfile());
            userDTO.setIsVerified(user.getIsVerified());
            userDTO.setDelFg(user.getDelFg());
            userDTO.setCreatedDate(user.getCreatedDate());
            userDTO.setUpdatedDate(user.getUpdatedDate());
            userDTO.setRoleName(user.getRole() != null ? user.getRole().getName() : null);

            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user-role/{userId}")
    public ResponseEntity<Map<String, String>> getUserRoleById(@PathVariable Long userId) {
        try {
            Optional<UserEntity> userOpt = userRepo.findById(userId);
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            UserEntity user = userOpt.get();
            Map<String, String> response = new HashMap<>();
            response.put("name", user.getName());
            response.put("roleName", user.getRole() != null ? user.getRole().getName() : "Unknown");

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}