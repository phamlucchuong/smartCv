package vn.chuongpl.user_service.configuration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.chuongpl.user_service.features.auth.JwtBlacklistService;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtBlacklistFilter extends OncePerRequestFilter {
    private final JwtBlacklistService jwtBlacklistService;
//
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            if (jwtBlacklistService.isBlacklisted(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("Token has been revoked (Blacklisted)");
                return; // Chặn đứng tại đây
            }
        }

        filterChain.doFilter(request, response);
    }
}