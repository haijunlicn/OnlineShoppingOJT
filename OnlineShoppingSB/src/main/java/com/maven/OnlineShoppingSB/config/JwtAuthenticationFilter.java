package com.maven.OnlineShoppingSB.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;
    @Autowired private UserDetailsService userDetailsService;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getServletPath();
        String method = request.getMethod();

        // ✅ GET method အားလုံးကို JWT token မစစ်ပဲ လွတ်ခွင့်ပြု
        if (method.equalsIgnoreCase("GET")) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ Auth URLs တွေကို JWT token မစစ်ပဲ လွတ်ခွင့်ပြု
        if (path.startsWith("/auth/") ) {
            chain.doFilter(request, response);
            return;
        }

        // ✅ အခြား POST, PUT, DELETE request တွေ JWT token စစ်မယ်
        final String authHeader = request.getHeader("Authorization");
        final String token;
        final String email;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // 👉 Token မပါလို့ 403 ပေးမယ်
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("403 - Forbidden: Missing or invalid token");
            return;
        }

        token = authHeader.substring(7);
        System.out.println("JWT Token from request: " + token);
        email = jwtService.extractEmail(token);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            if (jwtService.isTokenValid(token)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                // 👉 Token expired or invalid
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("403 - Forbidden: Invalid or expired token");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}