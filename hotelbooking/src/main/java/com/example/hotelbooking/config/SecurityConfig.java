package com.example.hotelbooking.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.http.HttpMethod;
import com.example.hotelbooking.security.JwtFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    // ⭐ BỎ QUA SWAGGER KHỎI SECURITY
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (WebSecurity web) -> web.ignoring().requestMatchers(
                "/v3/api-docs/**",
                "/swagger-ui/**",
                "/swagger-ui.html"
        );
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
                .sessionManagement(session
                        -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // swagger
                .requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                ).permitAll()
                // auth
                .requestMatchers("/auth/**", "/create-admin").permitAll()
                .requestMatchers(HttpMethod.POST, "/hotels/*/image").hasRole("ADMIN")
                // public APIs
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/coupons/active").permitAll()
                .requestMatchers("/hotels/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/rooms/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/reviews/**").permitAll()
                
                // user APIs
                .requestMatchers("/users/me", "/users/me/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/host/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/bookings/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/wishlist/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/reviews/**").hasAnyRole("USER", "ADMIN")
                .requestMatchers("/rooms/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/coupons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/coupons/**").hasRole("ADMIN")
                // admin APIs
                .requestMatchers("/users/**").hasRole("ADMIN")
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // tất cả request còn lại
                .anyRequest().authenticated()
                )
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173"
        ));

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source
                = new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
