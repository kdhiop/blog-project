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
        registry.addMapping("/api/**")
            .allowedOriginPatterns(frontendUrl, "http://localhost:*") // 패턴 기반 허용
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600); // CORS preflight 캐시 시간
        
        // 모든 경로에 대해서도 CORS 허용 (필요시)
        registry.addMapping("/**")
            .allowedOriginPatterns(frontendUrl)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
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