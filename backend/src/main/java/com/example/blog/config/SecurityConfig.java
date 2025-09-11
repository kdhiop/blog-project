package com.example.blog.config;

import com.example.blog.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
		this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// 인증 없이 접근 가능한 엔드포인트
						.requestMatchers("/auth/login", "/auth/register").permitAll().requestMatchers("/h2-console/**")
						.permitAll()

						// GET 요청은 인증 없이 허용 (블로그 읽기)
						.requestMatchers(HttpMethod.GET, "/posts/**").permitAll()

						// 나머지 모든 요청은 인증 필요
						.anyRequest().authenticated())
				.headers(headers -> headers
						// H2 Console을 위한 프레임 옵션 비활성화
						.frameOptions().disable()
						// 기본 보안 헤더 추가
						.contentTypeOptions().and())
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	BCryptPasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder(12); // 더 강력한 암호화 강도
	}
}