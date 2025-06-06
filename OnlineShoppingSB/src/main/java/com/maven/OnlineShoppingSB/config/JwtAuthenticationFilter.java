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

        // Register နဲ့ Login ကို JWT token စစ်မစမ်းဘဲ လွတ်ခွင့်ပြုမယ်
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        if (path.equals("/user/register") || path.equals("/user/login")) {
=======
        if (path.equals("/user/register") || path.equals("/user/login") || path.equals("/locations/save")) {
>>>>>>> Stashed changes
=======
        if (path.equals("/user/register") || path.equals("/user/login") || path.equals("/locations/save")) {
>>>>>>> Stashed changes
=======
        if (path.equals("/user/register") || path.equals("/user/login") || path.equals("/locations/save")) {
>>>>>>> Stashed changes
            chain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String token;
        final String email;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        token = authHeader.substring(7);
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        System.out.println("JWT Token from request: " + token);
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
        email = jwtService.extractEmail(token);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (jwtService.isTokenValid(token)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chain.doFilter(request, response);
    }

<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
}

=======
}
>>>>>>> Stashed changes
=======
}
>>>>>>> Stashed changes
=======
}
>>>>>>> Stashed changes
