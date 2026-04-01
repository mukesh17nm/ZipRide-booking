package com.taxi.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── PUBLIC ──────────────────────────────────────────────
                .requestMatchers(
                    "/api/auth/signup", "/api/auth/login",
                    "/api/auth/forgot-password", "/api/auth/check-email"
                ).permitAll()

                // ── ADMIN only ───────────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/drivers").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/promo/create").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/api/promo/all").hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/api/ratings/warned-drivers").hasAnyRole("ADMIN")
                .requestMatchers(HttpMethod.GET,  "/api/drivers/users").hasRole("ADMIN")

                // ── ADMIN + DRIVER ───────────────────────────────────────
                .requestMatchers(HttpMethod.GET,   "/api/drivers").hasAnyRole("ADMIN", "DRIVER")
                .requestMatchers(HttpMethod.PATCH, "/api/drivers/*/status").hasAnyRole("ADMIN", "DRIVER")
                .requestMatchers("/api/surge/**").hasAnyRole("ADMIN", "DRIVER")

                // ── ADMIN + PASSENGER ────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/drivers/find-nearest").hasAnyRole("ADMIN", "PASSENGER")
                .requestMatchers(HttpMethod.POST, "/api/drivers/match").hasAnyRole("ADMIN", "PASSENGER")
                .requestMatchers(HttpMethod.POST, "/api/fare/estimate").hasAnyRole("ADMIN", "PASSENGER")
                .requestMatchers(HttpMethod.POST, "/api/ratings/submit").hasAnyRole("ADMIN", "PASSENGER")
                .requestMatchers(HttpMethod.POST, "/api/promo/apply").hasAnyRole("ADMIN", "PASSENGER")
                .requestMatchers(HttpMethod.GET,  "/api/promo/active").hasAnyRole("ADMIN", "PASSENGER")

                // ── Rides — ALL authenticated users ─────────────────────
                .requestMatchers("/api/fare/rides/**").authenticated()
                .requestMatchers("/api/fare/rides").authenticated()
                .requestMatchers("/api/cancellation/**").authenticated()

                // ── All other requests need authentication ───────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
