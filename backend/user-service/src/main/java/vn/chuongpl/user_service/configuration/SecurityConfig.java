package vn.chuongpl.user_service.configuration;

import java.util.List;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @Value("${FE_DOMAIN:http://localhost:4127}")
    String FE_DOMAIN = "http://localhost:4127";

    final String[] PUBLIC_POST_ENDPOINT = {
            "/api/auth/register",
            "/api/auth/verify-registration",
            "/api/auth/resend-otp",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/login",
            "/api/auth/introspect",
            "/api/auth/refresh",
            "/api/users",
    };

    final String[] PUBLIC_GET_ENDPOINT = {
            "/api/users/verify-email/{email}",
            "/api/otp/verify",
    };

    final String[] SWAGGER_ENDPOINT = {
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/swagger-resources/**",
            "/webjars/**"
    };

    @Autowired
    CustomerJwtDecoder customerJwtDecoder;
    @Autowired
    JwtBlacklistFilter jwtBlacklistFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity httpSecurity) throws Exception {

        httpSecurity
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .addFilterBefore(jwtBlacklistFilter, BearerTokenAuthenticationFilter.class)
                .authorizeHttpRequests(request -> request
                        .requestMatchers(SWAGGER_ENDPOINT).permitAll()
                        .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINT).permitAll()
                        .requestMatchers(HttpMethod.GET, PUBLIC_GET_ENDPOINT).permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwtConfiguer -> jwtConfiguer
                        .decoder(customerJwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())));
        return httpSecurity.build();
    }

    @Bean
    public UrlBasedCorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(FE_DOMAIN));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter jwtGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
        jwtGrantedAuthoritiesConverter.setAuthorityPrefix("");
        jwtGrantedAuthoritiesConverter.setAuthoritiesClaimName("scope");
        JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
        jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwtGrantedAuthoritiesConverter);
        return jwtAuthenticationConverter;
    }
}
