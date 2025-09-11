package com.example.blog.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

	private final SecretKey secretKey;
	private final long validityInMilliseconds;

	public JwtTokenProvider(
			@Value("${jwt.secret:defaultSecretKeyForBlogApplicationThatShouldBeChangedInProduction}") String secret,
			@Value("${jwt.validity-in-ms:86400000}") long validityInMilliseconds // 24시간
	) {
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
		this.validityInMilliseconds = validityInMilliseconds;
	}

	// 토큰 생성
	public String createToken(String username, Long userId) {
		Claims claims = Jwts.claims().setSubject(username);
		claims.put("userId", userId);

		Date now = new Date();
		Date validity = new Date(now.getTime() + validityInMilliseconds);

		return Jwts.builder().setClaims(claims).setIssuedAt(now).setExpiration(validity)
				.signWith(secretKey, SignatureAlgorithm.HS256).compact();
	}

	// 토큰에서 username 추출
	public String getUsername(String token) {
		return Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody().getSubject();
	}

	// 토큰에서 userId 추출
	public Long getUserId(String token) {
		Claims claims = Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody();

		return claims.get("userId", Long.class);
	}

	// 토큰 유효성 검증
	public boolean validateToken(String token) {
		try {
			Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	// 토큰 만료 여부 확인
	public boolean isTokenExpired(String token) {
		try {
			Date expiration = Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token).getBody()
					.getExpiration();
			return expiration.before(new Date());
		} catch (JwtException | IllegalArgumentException e) {
			return true;
		}
	}

	// Authorization 헤더에서 토큰 추출
	public String resolveToken(String bearerToken) {
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		return null;
	}
}