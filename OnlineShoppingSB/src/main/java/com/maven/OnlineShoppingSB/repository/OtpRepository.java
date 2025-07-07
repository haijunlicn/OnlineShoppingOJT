package com.maven.OnlineShoppingSB.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maven.OnlineShoppingSB.entity.OtpEntity;

@Repository
public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

	Optional<OtpEntity> findTopByUserIdAndOtpCodeOrderByCreatedDateDesc(Long userId, String otpCode);

    // Optional: For OTP resend logic - get all OTPs for this user and purpose if needed
    //List<Otp> findAllByUserIdAndPurpose(Integer userId);
}
