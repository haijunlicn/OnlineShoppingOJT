package com.maven.OnlineShoppingSB.service;

import com.maven.OnlineShoppingSB.dto.EmailValidationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class EmailValidationService {

    @Value("${abstractapi.email.key}")
    private String apiKey;

    private final RestTemplate restTemplate;

    public EmailValidationService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isValidEmail(String email) {
        try {
            String url = String.format("https://emailvalidation.abstractapi.com/v1/?api_key=%s&email=%s",
                    apiKey, email);
            EmailValidationResponse response = restTemplate.getForObject(url, EmailValidationResponse.class);
            System.out.println("email validation response : " + response);
            return response != null && response.isValid();
        } catch (Exception e) {
            System.err.println("Email validation failed: " + e.getMessage());
            System.out.println("invalid email");
            return false;
        }
    }
}
