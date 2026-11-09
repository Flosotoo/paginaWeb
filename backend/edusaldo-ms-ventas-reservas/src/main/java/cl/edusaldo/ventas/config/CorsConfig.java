package cl.edusaldo.ventas.config;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.*;
import org.springframework.web.cors.*;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {
  @Bean
  FilterRegistrationBean<CorsFilter> cors(
      @Value("${EDUSALDO_ALLOWED_ORIGINS:http://localhost:5173,http://localhost:4173}")
          String origins) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toList());
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    FilterRegistrationBean<CorsFilter> filter =
        new FilterRegistrationBean<>(new CorsFilter(source));
    filter.setOrder(-100);
    return filter;
  }
}
