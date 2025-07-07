package com.maven.OnlineShoppingSB.service;


import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.entity.OtpEntity;
import com.maven.OnlineShoppingSB.entity.RoleEntity;
import com.maven.OnlineShoppingSB.repository.OtpRepository;
import com.maven.OnlineShoppingSB.repository.RoleRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepo;
    @Autowired
    private RoleRepository roleRepo;
    @Autowired
    private OtpRepository otpRepo;
    @Autowired
    private EmailService emailService;
    @Autowired
    private JavaMailSender mailSender;
    private final Map<String, String> resetTokens = new HashMap<>(); // use Redis or DB in real app
    @Autowired
    private PasswordEncoder passwordEncoder;


//    public String registerUser(UserEntity userInput) {
//
//        // Step 1: Get customer role
//        RoleEntity customerRole = roleRepo.findByName("customer")
//                .orElseThrow(() -> new RuntimeException("Role not found"));
//
//        // Step 2: Check duplicate email for CUSTOMER only
//        boolean emailExistsForCustomer = userRepo.existsByEmailAndRole(userInput.getEmail(), customerRole);
//        if (emailExistsForCustomer) {
//            return "Email already exists for a customer account";
//        }
//
//        // Step 3: Set role and default values
//        String encryptedPassword = passwordEncoder.encode(userInput.getPassword());
//
//        userInput.setPassword(encryptedPassword);
//        userInput.setRole(customerRole);
//        userInput.setIsVerified(false);
//        userInput.setDelFg(false);
//        userInput.setCreatedDate(LocalDateTime.now());
//        userInput.setUpdatedDate(LocalDateTime.now());
//
//        // Step 4: Save user
//        UserEntity savedUser = userRepo.save(userInput);
//        System.out.println("//////////////////////////////////////////////////////////something fuck");
//        Long userId = savedUser.getId();
//        System.out.println("//////////////////////////////////////////////////////////something fuck" + userId);
//
//        // Step 5: Generate 6-digit OTP
//        int otpNum = new Random().nextInt(900000) + 100000;
//        String otpCode = String.valueOf(otpNum);
//        System.out.println(otpNum);
//        LocalDateTime now = LocalDateTime.now();
//        LocalDateTime expiryTime = now.plusMinutes(2);
//
//        System.out.println("HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
//        OtpEntity otp = new OtpEntity();
//        otp.setUser(savedUser);
//        otp.setOtpCode(otpCode);
//        otp.setIsUsed(false);
//        otp.setCreatedDate(now);
//        otp.setExpiryTime(expiryTime);
//        otpRepo.save(otp);
//        System.out.println("Fuck");
//
//        // Step 7: Send OTP email
//        boolean emailSent = emailService.sendOtpEmail(savedUser.getEmail(), otpCode);
//
//        if (emailSent) {
//            return "Email sent successfully. User ID: " + userId;
//        } else {
//            return "Failed to send email.";
//        }
//
//
//    }

    public String registerUser(UserEntity userInput) {

        // Step 1: Check if email already exists globally (for any role)
        boolean emailExists = userRepo.existsByEmail(userInput.getEmail());
        if (emailExists) {
            return "Email already exists";
        }

        // Step 2: Get customer role (assuming default role is "customer")
        RoleEntity customerRole = roleRepo.findByName("customer")
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Step 3: Encrypt password and set default fields
        String encryptedPassword = passwordEncoder.encode(userInput.getPassword());

        userInput.setPassword(encryptedPassword);
        userInput.setRole(customerRole);
        userInput.setIsVerified(false);
        userInput.setDelFg(false);
        LocalDateTime now = LocalDateTime.now();
        userInput.setCreatedDate(now);
        userInput.setUpdatedDate(now);

        // Step 4: Save user to database
        UserEntity savedUser = userRepo.save(userInput);
        Long userId = savedUser.getId();

        // Step 5: Generate 6-digit OTP
        int otpNum = new Random().nextInt(900000) + 100000;
        String otpCode = String.valueOf(otpNum);

        // Step 6: Prepare OTP entity
        OtpEntity otp = new OtpEntity();
        otp.setUser(savedUser);
        otp.setOtpCode(otpCode);
        otp.setIsUsed(false);
        otp.setCreatedDate(now);
        otp.setExpiryTime(now.plusMinutes(2));
        otpRepo.save(otp);

        // Step 7: Send OTP email
        boolean emailSent = emailService.sendOtpEmail(savedUser.getEmail(), otpCode);

        if (emailSent) {
            return "Email sent successfully. User ID: " + userId;
        } else {
            return "Failed to send email.";
        }
    }

    public void sendResetLink(String email) {
        try {
            UserEntity user = userRepo.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String token = UUID.randomUUID().toString();
            resetTokens.put(token, email);

            String resetLink = "http://localhost:4200/customer/auth/reset-password?token=" + token;

            String htmlContent = """
                    <div style="max-width: 600px; margin: auto; padding: 24px; font-family: Arial, sans-serif; border: 1px solid #eee; border-radius: 8px;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 36px;">🔒</div>
                        <h2>Password Reset Request</h2>
                      </div>
                      <p>Hello,</p>
                      <p>We received a request to reset your password. If you didn’t request this, you can safely ignore this email.</p>
                      <p>Otherwise, click the button below to reset your password:</p>
                      <div style="text-align: center; margin: 24px 0;">
                        <a href="%s" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                      </div>
                      <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                      <p style="font-size: 12px; color: #888;">%s</p>
                      <hr style="margin-top: 32px;">
                      <p style="font-size: 12px; color: #999;">If you didn’t request a password reset, no action is required.</p>
                    </div>
                    """.formatted(resetLink, resetLink);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);
            helper.setTo(email);
            helper.setSubject("Password Reset Request");
            helper.setText(htmlContent, true); // true = isHtml

            mailSender.send(mimeMessage);
        } catch (RuntimeException e) {
            System.err.println("User error: " + e.getMessage());
            throw new RuntimeException("Unable to process reset request.");
        } catch (Exception e) {
            System.err.println("Email send error: " + e.getMessage());
            throw new RuntimeException("Failed to send reset email.");
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
