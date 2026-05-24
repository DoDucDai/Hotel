package com.example.hotelbooking.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.builders.WebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.example.hotelbooking.security.JwtFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] SWAGGER_ENDPOINTS = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
    };

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    // Swagger endpoints are public and bypass security filters.
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (WebSecurity web) -> web.ignoring().requestMatchers(SWAGGER_ENDPOINTS);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(SWAGGER_ENDPOINTS).permitAll()
                        .requestMatchers(HttpMethod.POST, "/auth/create-admin").hasRole("ADMIN")
                        .requestMatchers(
                                HttpMethod.POST,
                                "/auth/login",
                                "/auth/register",
                                "/auth/refresh",
                                "/auth/resend-verification",
                                "/auth/forgot-password",
                                "/auth/reset-password")
                        .permitAll()
                         .requestMatchers(
                                HttpMethod.GET,
                                "/auth/verify-email",
                                "/auth/reset-password/validate")
                        .permitAll()
                        .requestMatchers(HttpMethod.POST, "/hotels/*/image").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/payments/webhook/sandbox").permitAll()
                        .requestMatchers(HttpMethod.GET, "/payments/instructions").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/payments/sandbox/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/actuator/health/**", "/actuator/info").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/coupons/active").permitAll()
                        .requestMatchers("/hotels/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/bookings/revenue").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/bookings/room/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/users/me", "/users/me/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/host/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/bookings/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/wishlist/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/reviews/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/notifications/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/users/**").hasRole("ADMIN")
                        .requestMatchers("/admin/**").hasRole("ADMIN")
                        .requestMatchers("/rooms/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/coupons/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/coupons/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/coupons/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = parseAllowedOrigins(System.getenv("ALLOWED_ORIGINS"));

        configuration.setAllowedOrigins(allowedOrigins.isEmpty()
                ? List.of(
                        "http://localhost:5173", "http://127.0.0.1:5173",
                        "http://localhost:5174", "http://127.0.0.1:5174"
                  )
                : allowedOrigins);

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    private List<String> parseAllowedOrigins(String rawOrigins) {
        if (rawOrigins == null || rawOrigins.isBlank()) {
            return List.of();
        }

        return Arrays.stream(rawOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
    }
}
