package com.example.blog.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
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
    protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                  @NonNull HttpServletResponse response,
                                  @NonNull FilterChain filterChain) throws ServletException, IOException {

        String requestPath = request.getRequestURI();
        String method = request.getMethod();
        String authHeader = request.getHeader("Authorization");

        try {
            String token = tokenProvider.resolveToken(authHeader);

            if (token != null) {
                logger.debug("JWT 토큰 발견: {} {}", method, requestPath);
                
                if (tokenProvider.validateToken(token)) {
                    String username = tokenProvider.getUsername(token);
                    logger.debug("JWT 토큰 검증 성공. 사용자: {}", username);

                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                            if (userDetails != null && userDetails.isEnabled()) {
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
                            
                            // 401 응답 설정
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.getWriter().write("{\"error\":\"Authentication failed\"}");
                            return;
                        }
                    }
                } else {
                    logger.debug("유효하지 않은 JWT 토큰: {} {}", method, requestPath);
                    SecurityContextHolder.clearContext();
                }
            } else if (authHeader != null && !authHeader.isEmpty()) {
                logger.debug("Authorization 헤더가 있지만 Bearer 토큰이 아님: {} {}", method, requestPath);
            }
        } catch (Exception e) {
            logger.error("JWT 토큰 처리 중 예외 발생: {} {} - {}", method, requestPath, e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // 인증이 필요없는 경로들
        boolean shouldSkip = isPublicPath(path, method);
        
        if (shouldSkip) {
            logger.debug("JWT 필터 건너뜀: {} {}", method, path);
        }
        
        return shouldSkip;
    }

    private boolean isPublicPath(String path, String method) {
        // 완전히 공개된 경로
        if (path.equals("/auth/login") || path.equals("/auth/register") || 
            path.startsWith("/h2-console") || path.equals("/error") ||
            path.equals("/favicon.ico") || path.startsWith("/static/") ||
            path.startsWith("/public/") || path.startsWith("/actuator/")) {
            return true;
        }

        // GET 요청만 허용되는 경로
        if ("GET".equals(method)) {
            return path.equals("/posts") || 
                   path.matches("/posts/\\d+") || 
                   path.matches("/posts/\\d+/comments");
        }

        return false;
    }
}