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
        // 실제 API 경로에 맞게 수정
        registry.addMapping("/**") // 모든 경로 허용
            .allowedOriginPatterns(frontendUrl, "http://localhost:*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 정적 리소스 핸들링 최적화
        registry.addResourceHandler("/static/**")
            .addResourceLocations("classpath:/static/")
            .setCachePeriod(3600)
            .resourceChain(true);
            
        // 이미지 업로드용 디렉토리 (향후 확장 시)
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/")
            .setCachePeriod(86400);
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // trailing slash 매칭 비활성화
        configurer.setUseTrailingSlashMatch(false);
    }
}