package com.example.blog.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, WebRequest request) {
        logger.warn("잘못된 인자: {} - {}", getClientInfo(request), ex.getMessage());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", ex.getMessage(), LocalDateTime.now());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex, WebRequest request) {
        logger.warn("타입 불일치: {} - {}", getClientInfo(request), ex.getMessage());
        String message = String.format("'%s' 파라미터의 값 '%s'이(가) 올바르지 않습니다", ex.getName(), ex.getValue());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", message, LocalDateTime.now());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(HttpMessageNotReadableException ex, WebRequest request) {
        logger.warn("JSON 파싱 오류: {} - {}", getClientInfo(request), ex.getMessage());
        ErrorResponse error = new ErrorResponse("BAD_REQUEST", "요청 데이터 형식이 올바르지 않습니다", LocalDateTime.now());
        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(NoResourceFoundException ex, WebRequest request) {
        logger.warn("리소스 없음: {} - {}", getClientInfo(request), ex.getMessage());
        ErrorResponse error = new ErrorResponse("NOT_FOUND", "요청한 리소스를 찾을 수 없습니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponse> handleSecurityException(SecurityException ex, WebRequest request) {
        logger.warn("보안 예외: {} - {}", getClientInfo(request), ex.getMessage());
        
        if (ex.getMessage().contains("토큰") || ex.getMessage().contains("인증")) {
            ErrorResponse error = new ErrorResponse("UNAUTHORIZED", ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } else {
            ErrorResponse error = new ErrorResponse("FORBIDDEN", "권한이 없습니다: " + ex.getMessage(), LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
        }
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, WebRequest request) {
        logger.warn("접근 거부: {} - {}", getClientInfo(request), ex.getMessage());
        ErrorResponse error = new ErrorResponse("FORBIDDEN", "접근이 거부되었습니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, WebRequest request) {
        logger.warn("잘못된 인증 정보: {} - {}", getClientInfo(request), ex.getMessage());
        ErrorResponse error = new ErrorResponse("UNAUTHORIZED", "잘못된 인증 정보입니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException ex, WebRequest request) {
        logger.warn("런타임 예외: {} - {}", getClientInfo(request), ex.getMessage());
        
        String message = ex.getMessage();
        if (message.contains("찾을 수 없습니다") || message.contains("존재하지 않습니다")) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", message, LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } else if (message.contains("이미 존재") || message.contains("중복")) {
            ErrorResponse error = new ErrorResponse("CONFLICT", message, LocalDateTime.now());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
        } else {
            ErrorResponse error = new ErrorResponse("BAD_REQUEST", message, LocalDateTime.now());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        logger.warn("유효성 검증 실패: {} - {}", getClientInfo(request), ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
            logger.debug("필드 검증 오류 - {}: {}", fieldName, errorMessage);
        });

        ValidationErrorResponse errorResponse = new ValidationErrorResponse(
            "VALIDATION_FAILED", 
            "입력값 검증에 실패했습니다",
            LocalDateTime.now(), 
            errors
        );

        return ResponseEntity.badRequest().body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, WebRequest request) {
        logger.error("예상치 못한 예외 발생: {} - {}", getClientInfo(request), ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다", LocalDateTime.now());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }

    private String getClientInfo(WebRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null) {
            clientIp = request.getHeader("X-Real-IP");
        }
        return String.format("IP=%s, UA=%s", 
                           clientIp != null ? clientIp.split(",")[0].trim() : "unknown",
                           userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 50)) : "unknown");
    }

    public record ErrorResponse(
        String code,
        String message,
        LocalDateTime timestamp
    ) {}

    public record ValidationErrorResponse(
        String code,
        String message,
        LocalDateTime timestamp,
        Map<String, String> fieldErrors
    ) {}
}