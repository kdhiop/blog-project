package com.example.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String authHeader = request.getHeader("Authorization");

        try {
            String token = tokenProvider.resolveToken(authHeader);

            if (token != null) {
                logger.debug("JWT 토큰 발견: {}", requestPath);
                
                if (tokenProvider.validateToken(token)) {
                    String username = tokenProvider.getUsername(token);
                    logger.debug("JWT 토큰 검증 성공. 사용자: {}", username);

                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            if (userDetails != null) {
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                
                                logger.debug("사용자 인증 설정 완료: {}", username);
                            }
                        } catch (Exception e) {
                            logger.error("사용자 인증 설정 중 오류 발생: {}", e.getMessage());
                            SecurityContextHolder.clearContext();
                        }
                    }
                } else {
                    logger.warn("유효하지 않은 JWT 토큰: {}", requestPath);
                    SecurityContextHolder.clearContext();
                }
            } else if (authHeader != null) {
                logger.debug("Authorization 헤더가 있지만 Bearer 토큰이 아님: {}", requestPath);
            }
        } catch (Exception e) {
            logger.error("JWT 토큰 처리 중 예외 발생: {}", e.getMessage(), e);
            SecurityContextHolder.clearContext();
            
            // 토큰 관련 오류가 발생해도 필터 체인은 계속 진행
            // 인증이 필요한 엔드포인트에서는 Spring Security가 401을 반환함
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // 인증이 필요없는 경로들
        boolean shouldSkip = path.equals("/auth/login") || 
               path.equals("/auth/register") || 
               path.startsWith("/h2-console") ||
               (path.equals("/posts") && "GET".equals(method)) ||
               (path.matches("/posts/\\d+") && "GET".equals(method)) ||
               (path.matches("/posts/\\d+/comments") && "GET".equals(method)) ||
               path.startsWith("/actuator") || // Spring Boot Actuator (필요시)
               path.equals("/favicon.ico") ||
               path.startsWith("/static/");
        
        if (shouldSkip) {
            logger.debug("JWT 필터 건너뜀: {} {}", method, path);
        }
        
        return shouldSkip;
    }
}