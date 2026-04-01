package com.taxi.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Utility class for generating and validating JWT tokens.
 *
 * Token contains:
 *  - subject  : user email
 *  - role     : ADMIN | DRIVER | PASSENGER
 *  - userId   : database user id
 *  - expiry   : 24 hours
 */
@Component
public class JwtUtil {

    // Secret key — in production store in environment variable
    private static final String SECRET = "ZipRideSuperSecretKeyForJWTTokenGeneration2024!@#$";
    private static final long EXPIRATION_MS = 86400000L; // 24 hours

    private final Key key = Keys.hmacShaKeyFor(SECRET.getBytes());

    /** Generate a JWT token for a logged-in user */
    public String generateToken(String email, String role, Long userId) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("userId", userId)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Extract email (subject) from token */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /** Extract role from token */
    public String extractRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    /** Extract userId from token */
    public Long extractUserId(String token) {
        return ((Number) parseClaims(token).get("userId")).longValue();
    }

    /** Validate token — returns true if valid and not expired */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
