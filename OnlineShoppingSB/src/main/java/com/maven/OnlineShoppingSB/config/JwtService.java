package com.maven.OnlineShoppingSB.config;

import com.maven.OnlineShoppingSB.entity.UserEntity;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

<<<<<<< Updated upstream
import java.security.Key;
import java.util.Date;
=======

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
>>>>>>> Stashed changes

@Service
public class JwtService {

<<<<<<< Updated upstream
    private final String SECRET_KEY = "maycustomsecretmaycustomsecretmaycustomsecret"; // must be 32+ chars

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    public String generateTokenWithUserDetails(UserEntity u) {
        long expirationTime = 7 * 24 * 60 * 60 * 1000L; // 7 days

        return Jwts.builder()
                .setSubject(u.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(getSignInKey()) // ✅ consistent
=======
    private final String SECRET_KEY = "maycustomsecretmaycustomsecretmaycustomsecret"; // use 256-bit key (min 32 char)


    public String generateTokenWithUserDetails(UserEntity u) {
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
>>>>>>> Stashed changes
                .compact();
    }

    public String extractEmail(String token) {
<<<<<<< Updated upstream
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
=======
        return Jwts.parserBuilder().setSigningKey(SECRET_KEY.getBytes()).build()
                .parseClaimsJws(token).getBody().getSubject();
>>>>>>> Stashed changes
    }

    public boolean isTokenValid(String token) {
        try {
<<<<<<< Updated upstream
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
=======
            Jwts.parserBuilder().setSigningKey(SECRET_KEY.getBytes()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
>>>>>>> Stashed changes
