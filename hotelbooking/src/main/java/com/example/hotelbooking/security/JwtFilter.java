package com.example.hotelbooking.security;

import java.io.IOException;
import java.util.Collections;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {

                String token = authHeader.substring(7).trim();

                // ❗ check token rỗng
                if (token.isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // ❗ validate
                if (!JwtUtil.validateToken(token)) {
                    System.out.println("INVALID TOKEN");
                    filterChain.doFilter(request, response);
                    return;
                }

                String username = JwtUtil.getUsername(token);
                String role = JwtUtil.getRole(token);

                System.out.println("USERNAME: " + username);
                System.out.println("ROLE FROM TOKEN: " + role);

                if (role == null || role.isEmpty()) {
                    filterChain.doFilter(request, response);
                    return;
                }

                // ✅ FIX ROLE FORMAT
                String authority = role.startsWith("ROLE_")
                        ? role
                        : "ROLE_" + role.toUpperCase();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                Collections.singletonList(
                                        new SimpleGrantedAuthority(authority)));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.out.println("JWT ERROR: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}