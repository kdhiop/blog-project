package com.example.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Value("${app.frontend.url:http://localhost:5173}")
	private String frontendUrl;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		registry.addMapping("/**").allowedOrigins(frontendUrl) // 환경변수로 관리
				.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS").allowedHeaders("*").allowCredentials(true)
				.maxAge(3600); // CORS preflight 캐시 시간
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		// 정적 리소스 핸들링 (필요시)
		registry.addResourceHandler("/static/**").addResourceLocations("classpath:/static/").setCachePeriod(3600);
	}
}