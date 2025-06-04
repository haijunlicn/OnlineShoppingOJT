package com.maven.OnlineShoppingSB.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import com.maven.OnlineShoppingSB.entity.User;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final String SECRET_KEY = "maycustomsecretmaycustomsecretmaycustomsecret"; // use 256-bit key (min 32 char)


public String generateTokenWithUserDetails(User u) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("id", u.getId());
    claims.put("email", u.getEmail());
    claims.put("username", u.getName());
   

    return Jwts.builder()
            .setClaims(claims)
            .setSubject(u.getEmail())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 day
            .signWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes()))
            .compact();
}

    public String extractEmail(String token) {
        return Jwts.parserBuilder().setSigningKey(SECRET_KEY.getBytes()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(SECRET_KEY.getBytes()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
