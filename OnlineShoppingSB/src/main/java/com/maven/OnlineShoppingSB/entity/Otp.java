package com.maven.OnlineShoppingSB.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
@Getter
@Setter
public class Otp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "purpose")
    private String purpose; // e.g., "EMAIL_VERIFICATION"

    @Column(name = "is_used")
    private Boolean isUsed = false;

    @Column(name = "expiry_time")
    private LocalDateTime expiryTime;

    @Column(name = "created_date")
    private LocalDateTime createdDate;



}
