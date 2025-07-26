package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.entity.DiscountMechanismEntity;
import com.maven.OnlineShoppingSB.entity.DiscountUsageEntity;
import com.maven.OnlineShoppingSB.entity.UserEntity;
import com.maven.OnlineShoppingSB.repository.DiscountMechanismRepository;
import com.maven.OnlineShoppingSB.repository.DiscountUsageRepository;
import com.maven.OnlineShoppingSB.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DiscountUsageService {

    @Autowired
    private DiscountUsageRepository usageRepo;

    @Autowired
    private DiscountMechanismRepository mechanismRepo;

    @Autowired
    private UserRepository userRepository;

}
