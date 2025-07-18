package com.maven.OnlineShoppingSB.config;


import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import com.maven.OnlineShoppingSB.entity.UserEntity;


import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    private final String SECRET_KEY = "maycustomsecretmaycustomsecretmaycustomsecret"; // must be 32+ chars

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateTokenWithUserDetails(UserEntity u) {
        long expirationTime = 7 * 24 * 60 * 60 * 1000L; // 7 days

        return Jwts.builder()
                .setSubject(u.getEmail())
                .claim("roleType", u.getRole().getType()) // ✅ add roleType
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSignInKey())
                .compact();
    }


    public String extractEmail(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSignInKey()) // ✅ consistent
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException e) {
            System.out.println("❌ JWT parsing failed: " + e.getMessage());
            return null;
        }
    }

    public Integer extractRoleType(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSignInKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return claims.get("roleType", Integer.class); // ✅ typed cast
        } catch (JwtException e) {
            System.out.println("❌ Failed to extract roleType: " + e.getMessage());
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSignInKey()) // ✅ consistent
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            System.out.println("❌ Invalid JWT: " + e.getMessage());
            return false;
        }
    }
}