package com.example.blog.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey secretKey;
    private final long validityInMilliseconds;

    public JwtTokenProvider(
            @Value("${jwt.secret:defaultSecretKeyForBlogApplicationThatShouldBeChangedInProduction}") String secret,
            @Value("${jwt.validity-in-ms:86400000}") long validityInMilliseconds // 24시간
    ) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.validityInMilliseconds = validityInMilliseconds;
        logger.info("JWT Provider initialized with validity: {} ms", validityInMilliseconds);
    }

    // 토큰 생성
    public String createToken(String username, Long userId) {
        try {
            Claims claims = Jwts.claims().setSubject(username);
            claims.put("userId", userId);

            Date now = new Date();
            Date validity = new Date(now.getTime() + validityInMilliseconds);

            String token = Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();

            logger.debug("JWT 토큰 생성 완료: username={}, userId={}", username, userId);
            return token;
        } catch (Exception e) {
            logger.error("JWT 토큰 생성 실패: username={}, error={}", username, e.getMessage());
            throw new RuntimeException("토큰 생성에 실패했습니다", e);
        }
    }

    // 토큰에서 username 추출
    public String getUsername(String token) {
        try {
            return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT 토큰에서 username 추출 실패: {}", e.getMessage());
            throw new SecurityException("유효하지 않은 토큰입니다", e);
        }
    }

    // 토큰에서 userId 추출
    public Long getUserId(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();

            return claims.get("userId", Long.class);
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT 토큰에서 userId 추출 실패: {}", e.getMessage());
            throw new SecurityException("유효하지 않은 토큰입니다", e);
        }
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (SecurityException e) {
            logger.warn("JWT 서명 검증 실패: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.warn("잘못된 JWT 토큰: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.warn("만료된 JWT 토큰: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.warn("지원되지 않는 JWT 토큰: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.warn("잘못된 JWT 토큰 인자: {}", e.getMessage());
        }
        return false;
    }

    // Authorization 헤더에서 토큰 추출
    public String resolveToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ") && bearerToken.length() > 7) {
            return bearerToken.substring(7);
        }
        return null;
    }
}