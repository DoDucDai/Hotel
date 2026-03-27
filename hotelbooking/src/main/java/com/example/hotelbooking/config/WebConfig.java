package com.example.hotelbooking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {

        // Serve uploads from project root `uploads/` and legacy `src/.../uploads`
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations(
                "file:uploads/",
                "file:src/main/java/com/example/hotelbooking/uploads/"
            );
    }
}
