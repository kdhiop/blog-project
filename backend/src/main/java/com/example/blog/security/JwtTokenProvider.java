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
            @Value("${jwt.secret:aVerySecureSecretKeyForJWTTokenGenerationThatShouldBeAtLeast256BitsLongForHS256AlgorithmAndShouldBeChangedInProduction2024}") String secret,
            @Value("${jwt.validity-in-ms:86400000}") long validityInMilliseconds
    ) {
        // 키 길이 검증 추가
        if (secret.length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters long");
        }
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
        this.validityInMilliseconds = validityInMilliseconds;
        logger.info("JWT Provider initialized with validity: {} ms", validityInMilliseconds);
    }

    public String createToken(String username, Long userId) {
        try {
            Date now = new Date();
            Date validity = new Date(now.getTime() + validityInMilliseconds);

            String token = Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("iat", now.getTime() / 1000) // issued at (seconds)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey, Jwts.SIG.HS256) // 최신 방식
                .compact();

            logger.debug("JWT 토큰 생성 완료: username={}, userId={}", username, userId);
            return token;
        } catch (Exception e) {
            logger.error("JWT 토큰 생성 실패: username={}, error={}", username, e.getMessage());
            throw new RuntimeException("토큰 생성에 실패했습니다", e);
        }
    }

    public String getUsername(String token) {
        try {
            return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT 토큰에서 username 추출 실패: {}", e.getMessage());
            throw new SecurityException("유효하지 않은 토큰입니다", e);
        }
    }

    public Long getUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

            Object userIdObj = claims.get("userId");
            if (userIdObj instanceof Integer) {
                return ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                return (Long) userIdObj;
            } else {
                logger.error("userId claim has unexpected type: {}", userIdObj != null ? userIdObj.getClass() : "null");
                throw new SecurityException("토큰의 사용자 ID 형식이 올바르지 않습니다");
            }
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT 토큰에서 userId 추출 실패: {}", e.getMessage());
            throw new SecurityException("유효하지 않은 토큰입니다", e);
        }
    }

    public boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        
        try {
            Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
                
            // 추가 검증: 필수 클레임 확인
            if (claims.getSubject() == null || claims.get("userId") == null) {
                logger.warn("JWT 토큰에 필수 클레임이 누락됨");
                return false;
            }
            
            return true;
        } catch (SecurityException e) {
            logger.debug("JWT 서명 검증 실패: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.debug("잘못된 JWT 토큰: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.debug("만료된 JWT 토큰: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.debug("지원되지 않는 JWT 토큰: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.debug("잘못된 JWT 토큰 인자: {}", e.getMessage());
        } catch (Exception e) {
            logger.warn("JWT 토큰 검증 중 예상치 못한 오류: {}", e.getMessage());
        }
        return false;
    }

    public String resolveToken(String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ") && bearerToken.length() > 7) {
            return bearerToken.substring(7).trim();
        }
        return null;
    }
    
    public Date getExpirationDate(String token) {
        try {
            return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT 토큰에서 만료일 추출 실패: {}", e.getMessage());
            return null;
        }
    }
}