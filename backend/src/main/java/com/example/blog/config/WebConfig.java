package com.example.blog.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.*;

import java.time.Duration;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns(frontendUrl, "http://localhost:*", "https://localhost:*")
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 정적 리소스 핸들링 - Spring Boot 3.x 방식
        registry.addResourceHandler("/static/**")
            .addResourceLocations("classpath:/static/")
            .setCacheControl(CacheControl.maxAge(Duration.ofHours(1)))
            .resourceChain(true);
            
        // 업로드 파일용 디렉토리
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/")
            .setCacheControl(CacheControl.maxAge(Duration.ofDays(1)));
    }

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // Spring Boot 3.x에서 setUseTrailingSlashMatch는 deprecated
        // 대신 setUseSuffixPatternMatch 사용
        configurer.setUseSuffixPatternMatch(false);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // SPA 라우팅 지원 (React Router)
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/{spring:\\w+}").setViewName("forward:/index.html");
    }
}