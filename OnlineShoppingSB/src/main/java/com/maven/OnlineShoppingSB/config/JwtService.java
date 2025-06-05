package com.maven.OnlineShoppingSB.config;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
import com.maven.OnlineShoppingSB.entity.UserEntity;
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

<<<<<<< Updated upstream
<<<<<<< Updated upstream
=======
import com.maven.OnlineShoppingSB.entity.UserEntity;

>>>>>>> Stashed changes
import java.util.Date;

=======
import com.maven.OnlineShoppingSB.entity.UserEntity;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
>>>>>>> Stashed changes

@Service
public class JwtService {

    private final String SECRET_KEY = "maycustomsecretmaycustomsecretmaycustomsecret"; // use 256-bit key (min 32 char)


    public String generateTokenWithUserDetails(UserEntity u) {
<<<<<<< Updated upstream
        // 7 days in milliseconds: 7 * 24 * 60 * 60 * 1000
        long expirationTime = 7 * 24 * 60 * 60 * 1000L;

        return Jwts.builder()
                .setSubject(u.getEmail()) // Subject only
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
=======
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", u.getId());
        claims.put("email", u.getEmail());
        claims.put("username", u.getName());


        return Jwts.builder()
                .setClaims(claims)
                .setSubject(u.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 1 day
>>>>>>> Stashed changes
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