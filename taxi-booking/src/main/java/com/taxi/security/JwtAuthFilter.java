package com.taxi.security;

import com.taxi.model.AppUser;
import com.taxi.repository.AppUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT Authentication Filter.
 * Runs once per request — reads the Authorization header,
 * validates the JWT token, and sets the user in SecurityContext.
 *
 * Flow:
 *  Request → JwtAuthFilter → SecurityConfig → Controller
 *
 * If token is missing/invalid → SecurityConfig blocks the request (401)
 * If token is valid → user role is set → @PreAuthorize checks role
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AppUserRepository appUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Read Authorization header
        String authHeader = request.getHeader("Authorization");

        // Skip if no token (public endpoints like /login, /signup)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract token (remove "Bearer " prefix)
        String token = authHeader.substring(7);

        // Validate token
        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract user info from token
        String email = jwtUtil.extractEmail(token);
        String role  = jwtUtil.extractRole(token);

        // Only set authentication if not already set
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Verify user still exists in DB
            AppUser user = appUserRepository.findByEmail(email).orElse(null);

            if (user != null && user.isActive()) {
                // Create authority with ROLE_ prefix (Spring Security requirement)
                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority("ROLE_" + role));

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(email, null, authorities);

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set authentication in security context
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
